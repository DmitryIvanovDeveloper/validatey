import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type {
  ResearchAssistantLlmPort,
  ResearchAssistantContext,
  AssistantReply,
} from '../../application/ports/research-assistant-llm.port';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are an AI research assistant for product validation. The user is a PM doing research. Reply briefly. If they ask for market analysis or methods, suggest 1-3 concrete methods (e.g. "conjoint analysis", "survey", "A/B test") and optionally ask 1-2 clarifying questions (geography, segment, budget). Respond with ONLY a valid JSON object (no markdown): {"reply":"your reply text","suggestedMethods":["method1",...],"clarificationQuestions":["q1",...]}. Omit suggestedMethods or clarificationQuestions if not relevant. Use English.`;

@injectable()
export class ResearchAssistantLlmAdapter implements ResearchAssistantLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async reply(userMessage: string, context: ResearchAssistantContext): Promise<ResultEx<AssistantReply, Error>> {
    const userContent = `Project: ${context.projectName}\nHypothesis: ${context.hypothesisSummary}\n\nUser: ${userMessage}`;
    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\n${userContent}`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        { prompt: fullPrompt },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );

      const content = (response?.response ?? '').trim();
      if (!content) {
        return ResultEx.failure(new Error('Empty response from LLM'));
      }

      const result = this.parseJsonToReply(content);
      if (!result.isSuccess) {
        return result;
      }
      return ResultEx.success(result.data);
    } catch (err) {
      return ResultEx.failure(err instanceof Error ? err : new Error('Assistant failed'));
    }
  }

  private parseJsonToReply(content: string): ResultEx<AssistantReply, Error> {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return ResultEx.failure(new Error('Invalid response format: expected JSON'));
    }
    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const reply = typeof obj.reply === 'string' ? obj.reply.trim() : '';
      if (!reply) {
        return ResultEx.failure(new Error('Invalid response format: missing reply'));
      }
      const suggestedMethods = Array.isArray(obj.suggestedMethods)
        ? (obj.suggestedMethods as string[]).filter((m) => typeof m === 'string')
        : undefined;
      const clarificationQuestions = Array.isArray(obj.clarificationQuestions)
        ? (obj.clarificationQuestions as string[]).filter((q) => typeof q === 'string')
        : undefined;
      return ResultEx.success({ reply, suggestedMethods, clarificationQuestions });
    } catch {
      return ResultEx.failure(new Error('Invalid response format: invalid JSON'));
    }
  }
}
