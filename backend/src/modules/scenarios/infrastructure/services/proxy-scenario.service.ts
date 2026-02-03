import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ScenarioGenerationError } from '../../domain/errors/scenario.error';
import {
  LLMServicePort,
  GenerateScenarioRequest,
  GenerateScenarioResponse,
} from '../../application/ports/llm-service.port';
import { ScenarioMetadata } from '../../domain/entities/scenario.entity';

/** Single proxy: POST { prompt } -> { response }. No API key. */
const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

@injectable()
export class ProxyScenarioService implements LLMServicePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async generateScenario(
    request: GenerateScenarioRequest
  ): Promise<ResultEx<GenerateScenarioResponse, ScenarioGenerationError>> {
    this._logger.info('proxy-scenario.generate.start', { projectId: request.projectId });

    try {
      const systemPrompt = this._buildSystemPrompt();
      const userPrompt = this._buildUserPrompt(request);
      const fullPrompt = `${systemPrompt}\n\n---\nUser input:\n${userPrompt}`;

      const promptLength = fullPrompt.length;
      const promptPreview = fullPrompt.slice(0, 500) + (fullPrompt.length > 500 ? '...' : '');
      this._logger.info('proxy-scenario.generate.prompt', {
        promptLength,
        promptPreview,
        fullPrompt,
      });
      console.log('[STEP3 PROMPT] length=', promptLength, '\n--- fullPrompt ---\n', fullPrompt, '\n--- end ---');

      const proxyResponse = await this._httpClient.post<{ response?: string }>(
        AI_PROXY_URL,
        { prompt: fullPrompt },
        {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      );

      const content = (proxyResponse?.response ?? '').trim();
      if (!content) {
        this._logger.error('proxy-scenario.generate.empty-response', {});
        return ResultEx.failure(
          new ScenarioGenerationError('Empty response from AI proxy')
        );
      }

      const metadata: ScenarioMetadata = {
        tone: request.metadata?.tone || 'professional',
        length: request.metadata?.length ?? 10,
        branches: [],
      };

      this._logger.info('proxy-scenario.generate.success', { projectId: request.projectId });
      return ResultEx.success({ content, metadata });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this._logger.error('proxy-scenario.generate.error', { error: message });
      return ResultEx.failure(new ScenarioGenerationError(message));
    }
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

    if (request.hypothesis) {
      parts.push(
        'Hypothesis: ' + request.hypothesis.description,
        request.hypothesis.assumptions?.length
          ? 'Assumptions to validate: ' + request.hypothesis.assumptions.join('; ')
          : ''
      );
    }

    const tone = request.metadata?.tone || 'professional';
    const length = request.metadata?.length ?? 10;
    parts.push(`Tone: ${tone}. Approximate number of questions: ${length}.`);

    return parts.filter(Boolean).join('\n\n');
  }
}
