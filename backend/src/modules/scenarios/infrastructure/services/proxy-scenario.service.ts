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
        { prompt: fullPrompt }, // Remove model parameter to see default behavior
        {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      );

      let content = (proxyResponse?.response ?? '').trim();
      if (!content) {
        this._logger.error('proxy-scenario.generate.empty-response', {});
        return ResultEx.failure(
          new ScenarioGenerationError('Empty response from AI proxy')
        );
      }

      // Extract JSON from response if wrapped in markdown or extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        content = jsonMatch[0];
      }

      // Validate that content is a valid scenario format
      try {
        const parsed = JSON.parse(content);
        if (!Array.isArray(parsed.questions) || parsed.questions.length === 0) {
          throw new Error('Invalid scenario format: missing or empty questions array');
        }

        // Ensure all questions have required fields
        for (const question of parsed.questions) {
          if (!question.id || !question.text || !question.type) {
            throw new Error(`Invalid question format: missing id, text, or type in question ${JSON.stringify(question)}`);
          }

          // Validate question type
          const validTypes = ['scale', 'open', 'multiple_choice', 'audio'];
          if (!validTypes.includes(question.type)) {
            throw new Error(`Invalid question type: ${question.type}. Valid types are: ${validTypes.join(', ')}`);
          }
        }

        // Convert back to string to store as content
        content = JSON.stringify(parsed);
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';
        this._logger.error('proxy-scenario.generate.invalid-json', { error: errorMessage, content });
        return ResultEx.failure(
          new ScenarioGenerationError(`Invalid JSON response from AI: ${errorMessage}`)
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

OUTPUT FORMAT:
Respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "questions": [
    {
      "id": "unique_question_id",
      "text": "Question text",
      "type": "scale|open|multiple_choice|audio",
      "required": true|false,
      "options": {
        // For scale questions:
        "min": number,
        "max": number,
        "label": "optional label"
        // For multiple_choice questions:
        "choices": ["choice1", "choice2", ...],
        "multiple": true|false
      }
    }
  ]
}

Available question types:
- "scale": for rating questions (e.g. 1-5 scale)
- "open": for open-ended text responses
- "multiple_choice": for multiple choice questions
- "audio": for audio responses

Include 8-15 questions total. Mix different question types to get comprehensive validation data.

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
    const length = request.metadata?.length ?? 10;
    parts.push(
      '',
      `🎭 INTERVIEW STYLE: ${tone}`,
      `📊 TARGET LENGTH: ${length} questions`,
      '',
      'Remember the "Ask Your Mother" principle: Use simple language. Focus on problems, not solutions. Validate assumptions through past behavior, not future intentions.'
    );

    return parts.filter(Boolean).join('\n\n');
  }
}
