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
        length: request.metadata?.length || 0, // 0 means AI determines optimal length
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
    return `You are an expert product validation interviewer following the principles from Rob Fitzpatrick's "Ask Your Mother: How to Interview Customers and Confirm Your Business Idea If Everyone Lies."

Your task is to create a validation interview script that helps entrepreneurs and product managers validate their business hypotheses by asking the right questions that cut through the lies and get to the truth.

CORE PRINCIPLES TO FOLLOW:
1. "Ask Your Mother" - Use simple, conversational language that anyone can understand
2. Focus on problems and behaviors, not solutions and features
3. Validate assumptions by asking about past experiences, not future intentions
4. Use "Five Whys" technique to dig deeper when people give superficial answers
5. Create scenarios and examples to make questions concrete
6. Listen for contradictions between what people say and what they do
7. Ask about specific situations, not general opinions

SCRIPT STRUCTURE:
- Start with a brief, friendly introduction that explains the purpose
- Build rapport by asking about their background/role first
- Ask open-ended questions that explore the problem space
- Use follow-up questions to dig deeper ("Why?" "Tell me more about that")
- Include branching logic based on responses
- End with next steps or contact information

QUESTION TYPES TO INCLUDE:
- Problem discovery questions (current pain points)
- Solution exploration (what they've tried before)
- Behavior validation (what they actually do vs. what they say)
- Assumption testing (challenge key hypotheses)
- Emotional context (why they care about this problem)

OUTPUT FORMAT:
Write a natural, conversational interview script. Include:
- Interviewer instructions in [brackets]
- Natural dialogue flow
- Follow-up questions based on responses
- Optimal number of questions to thoroughly validate assumptions without exhausting the respondent
- Focus on quality over quantity - ask as many questions as needed but keep the interview engaging

Remember: People lie, exaggerate, or don't know what they want. Your job is to find the truth through careful questioning.`;
  }

  private _buildUserPrompt(request: GenerateScenarioRequest): string {
    const parts: string[] = [];

    if (request.prompt && request.prompt.trim()) {
      parts.push('🎯 CUSTOM INSTRUCTION: ' + request.prompt.trim());
    }

    if (request.segment) {
      const demo =
        typeof request.segment.demographics === 'string'
          ? request.segment.demographics
          : request.segment.demographics?.text ?? JSON.stringify(request.segment.demographics || {});
      parts.push(
        '👥 TARGET AUDIENCE:',
        '• Who they are: ' + request.segment.description,
        '• Demographics & context: ' + demo,
        '• Remember: Ask them to describe their actual daily work and challenges, not what they think you want to hear.'
      );
    }

    if (request.marketContext) {
      const mc = request.marketContext;
      if (mc.marketPicture?.trim()) {
        parts.push('🏢 MARKET CONTEXT: ' + mc.marketPicture.trim());
      }
      if (mc.marketFit?.trim()) {
        parts.push('🎯 MARKET FIT: ' + mc.marketFit.trim());
      }
      if (mc.differentiation?.trim()) {
        parts.push('⚡ DIFFERENTIATION: ' + mc.differentiation.trim());
      }
    }

    if (request.hypothesis) {
      parts.push(
        '💡 HYPOTHESIS TO VALIDATE:',
        request.hypothesis.description,
        '',
        '🚨 KEY ASSUMPTIONS THAT NEED TESTING:',
        request.hypothesis.assumptions?.length
          ? request.hypothesis.assumptions.map((assumption, i) => `${i + 1}. ${assumption}`).join('\n')
          : 'No specific assumptions listed - focus on core problem validation'
      );
      parts.push(
        '',
        '🔍 VALIDATION APPROACH:',
        '• Don\'t ask "Would you use this?" - ask "What do you do when [problem occurs]?"',
        '• Don\'t ask about features - ask about problems and current workarounds',
        '• Use specific examples and scenarios to get concrete answers',
        '• Follow up with "Why?" and "Tell me more" to dig deeper',
        '• Watch for contradictions between what they say and what they actually do'
      );
    }

    if (request.significanceTarget) {
      parts.push(
        '',
        `📊 SAMPLE SIZE TARGET: ${request.significanceTarget} respondents`,
        `• Design questions optimized for ${request.significanceTarget} responses`,
        `• Focus on qualitative insights over quantitative metrics`,
        `• Each question should provide actionable data with this sample size`,
        `• Avoid questions requiring large samples for statistical significance`
      );
    }

    const tone = request.metadata?.tone || 'professional';
    parts.push(
      '',
      `🎭 INTERVIEW STYLE: ${tone}`,
      '',
      'Remember the "Ask Your Mother" principle: Use simple language. Focus on problems, not solutions. Validate assumptions through past behavior, not future intentions.',
      '',
      '📊 QUESTION COUNT: Determine the optimal number of questions to thoroughly validate all assumptions while keeping the interview engaging and not exhausting for the respondent. Quality over quantity - ask as many as needed but maintain flow and interest.'
    );

    return parts.filter(Boolean).join('\n\n');
  }
}
