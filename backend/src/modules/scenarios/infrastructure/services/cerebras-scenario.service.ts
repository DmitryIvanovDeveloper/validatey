import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ScenarioGenerationError } from '../../domain/errors/scenario.error';
import { LLMServicePort, GenerateScenarioRequest, GenerateScenarioResponse } from '../../application/ports/llm-service.port';
import { ScenarioMetadata } from '../../domain/entities/scenario.entity';

interface CerebrasChatMessage {
  role: 'system' | 'user';
  content: string;
}

interface CerebrasChatCompletionRequest {
  model: string;
  messages: CerebrasChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface CerebrasChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

@injectable()
export class CerebrasScenarioService implements LLMServicePort {
  private readonly _apiKeys: string[];
  private _currentKeyIndex = 0;
  private readonly _model: string;

  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {
    const apiKeyEnv = process.env.CEREBRAS_API_KEY;
    if (!apiKeyEnv || !apiKeyEnv.trim()) {
      throw new Error('CEREBRAS_API_KEY is required when using Cerebras for scenario generation');
    }
    this._apiKeys = apiKeyEnv.split(',').map((k) => k.trim()).filter((k) => k.length > 0);
    if (this._apiKeys.length === 0) {
      throw new Error('No valid API keys in CEREBRAS_API_KEY');
    }
    this._model = process.env.CEREBRAS_MODEL || 'llama-3.3-70b';
  }

  async generateScenario(
    request: GenerateScenarioRequest
  ): Promise<ResultEx<GenerateScenarioResponse, ScenarioGenerationError>> {
    this._logger.info('cerebras-scenario.generate.start', { projectId: request.projectId });

    try {
      const systemPrompt = this._buildSystemPrompt();
      const userPrompt = this._buildUserPrompt(request);

      const body: CerebrasChatCompletionRequest = {
        model: this._model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      };

      const apiKey = this._getNextApiKey();
      const response = await this._httpClient.post<CerebrasChatCompletionResponse>(
        CEREBRAS_API_URL,
        body,
        {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      );

      const content = response?.choices?.[0]?.message?.content;
      if (!content || typeof content !== 'string' || !content.trim()) {
        this._logger.error('cerebras-scenario.generate.invalid-response', { response });
        return ResultEx.failure(
          new ScenarioGenerationError('Invalid or empty response from Cerebras API')
        );
      }

      const metadata: ScenarioMetadata = {
        tone: request.metadata?.tone || 'professional',
        length: request.metadata?.length ?? 10,
        branches: [],
      };

      this._logger.info('cerebras-scenario.generate.success', { projectId: request.projectId });
      return ResultEx.success({
        content: content.trim(),
        metadata,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this._logger.error('cerebras-scenario.generate.error', { error: message });
      return ResultEx.failure(new ScenarioGenerationError(message));
    }
  }

  private _getNextApiKey(): string {
    const key = this._apiKeys[this._currentKeyIndex];
    this._currentKeyIndex = (this._currentKeyIndex + 1) % this._apiKeys.length;
    return key;
  }

  private _buildSystemPrompt(): string {
    return `You are a product validation scenario writer. Generate a short validation scenario (script) for interviewing target users to validate a product hypothesis.

Output only the scenario text: a clear, conversational script that a researcher would use to run a validation interview. Include:
- Brief intro and context for the interviewee
- 5–12 open questions that explore the hypothesis and assumptions
- Natural flow (no bullet lists in the script unless you explicitly format it that way)
- Optional branching (e.g. "If they say X, ask...") if it helps

Use the tone and length requested. Do not output JSON or meta-commentary, only the scenario content.`;
  }

  private _buildUserPrompt(request: GenerateScenarioRequest): string {
    const parts: string[] = [];

    if (request.prompt && request.prompt.trim()) {
      parts.push('Custom instruction: ' + request.prompt.trim());
    }

    if (request.segment) {
      const demo =
        typeof request.segment.demographics === 'string'
          ? request.segment.demographics
          : request.segment.demographics?.text ?? JSON.stringify(request.segment.demographics || {});
      parts.push(
        'Target segment: ' + request.segment.description,
        'Demographics: ' + demo
      );
    }

    if (request.hypothesis) {
      parts.push(
        'Hypothesis: ' + request.hypothesis.description,
        request.hypothesis.assumptions?.length
          ? 'Assumptions to validate: ' + request.hypothesis.assumptions.join('; ')
          : ''
      );
    }

    if (request.marketContext) {
      const mc = request.marketContext;
      if (mc.marketPicture?.trim()) {
        parts.push('Current market picture (who are the players, what they offer, who buys): ' + mc.marketPicture.trim());
      }
      if (mc.marketFit?.trim()) {
        parts.push('How the product fits in the market / share of paying audience: ' + mc.marketFit.trim());
      }
      if (mc.differentiation?.trim()) {
        parts.push('How the product differs / what can attract audience and win new buyers: ' + mc.differentiation.trim());
      }
    }

    const tone = request.metadata?.tone || 'professional';
    const length = request.metadata?.length ?? 10;
    parts.push(`Tone: ${tone}. Approximate number of questions: ${length}.`);

    return parts.filter(Boolean).join('\n\n');
  }
}
