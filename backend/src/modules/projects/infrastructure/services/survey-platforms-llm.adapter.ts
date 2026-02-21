import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type {
  SurveyPlatformsLlmPort,
  SurveyPlatformsLlmInput,
  SurveyPlatformSuggestion,
} from '../../application/ports/survey-platforms-llm.port';
import { AiModuleError } from '../../../ai/domain/errors/ai.error';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are an AI assistant that suggests survey distribution platforms for product validation research.

Given project details (target segment, hypothesis, assumptions, audience, market context, product cost), suggest 3-5 survey distribution platforms where the PM can share their survey to get responses from the target audience.

For EACH platform, generate a ready-to-post message that:
- Is natural and human-written (NO AI markers like long dashes, excessive emojis, or overly formal language)
- Mentions the product hypothesis and key assumptions naturally
- Encourages people to take the survey
- Fits the platform's tone and style (Reddit is casual, LinkedIn is professional, etc.)
- Is concise but engaging (2-4 short paragraphs)
- Does NOT sound like AI-generated content

Respond with ONLY a valid JSON array (no markdown, no extra text):
[
  {
    "platform": "Platform name (e.g., 'Reddit', 'LinkedIn', 'Discord')",
    "subplatform": "Optional specific subreddit/group/channel name",
    "reason": "Why this platform fits the target segment (1-2 sentences)",
    "postingStrategy": "How to post (e.g., 'Join relevant subreddits and post in daily threads', 'Share in LinkedIn groups')",
    "expectedReach": "Expected reach (e.g., '100-500 responses', '50-200 responses')",
    "post": "Ready-to-post message for this platform (natural, human-like, mentions hypothesis and assumptions, encourages survey participation)"
  }
]

Rules:
- Focus on platforms where the target segment is active
- Consider product cost/budget (free vs paid platforms)
- Suggest both free (Reddit, Discord, LinkedIn groups) and paid (Respondent.io, Prolific) options
- Be specific about subplatforms (e.g., specific subreddits, Discord servers)
- Expected reach should be realistic based on platform size and engagement
- Posting strategy should be actionable and specific
- Posts must sound natural and human - avoid AI writing patterns
- Posts should naturally incorporate the hypothesis and assumptions without being obvious`;

@injectable()
export class SurveyPlatformsLlmAdapter implements SurveyPlatformsLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async suggest(input: SurveyPlatformsLlmInput): Promise<ResultEx<SurveyPlatformSuggestion[], AiModuleError>> {
    // Build context from input
    const contextParts: string[] = [];
    
    if (input.targetSegment) {
      contextParts.push(`Target Segment: ${input.targetSegment}`);
    }
    if (input.productHypothesis) {
      contextParts.push(`Product Hypothesis: ${input.productHypothesis}`);
    }
    if (input.hypothesisAssumptions && input.hypothesisAssumptions.length > 0) {
      contextParts.push(`Key Assumptions:\n${input.hypothesisAssumptions.map((a, i) => `${i + 1}. ${a}`).join('\n')}`);
    }
    if (input.targetAudience) {
      contextParts.push(`Target Audience: ${input.targetAudience}`);
    }
    if (input.marketContext) {
      contextParts.push(`Market Context: ${input.marketContext}`);
    }
    if (input.productCost !== null && input.productCost !== undefined) {
      contextParts.push(`Product Cost: $${input.productCost}`);
    }

    if (contextParts.length === 0) {
      return ResultEx.failure(
        new AiModuleError('Provide at least target segment or product hypothesis for platform suggestions')
      );
    }

    const userContent = contextParts.join('\n\n');

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: `${SYSTEM_PROMPT}\n\n---\nProject Details:\n${userContent}`,
          model: 'llama3.1-8b',
        },
        {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)',
        }
      );

      const raw = (response?.response ?? '').trim();
      if (!raw) {
        return ResultEx.failure(new AiModuleError('Empty response from AI'));
      }

      const platforms = this.parseResponse(raw);
      return ResultEx.success(platforms);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const isBlocked =
        message.includes('403') ||
        message.includes('Cloudflare') ||
        message.includes('<!DOCTYPE') ||
        message.length > 500;
      
      const errorMessage = isBlocked
        ? 'AI proxy is unavailable (blocked or 403). Try again later.'
        : `Survey platforms suggestion failed: ${message}`;
      
      return ResultEx.failure(new AiModuleError(errorMessage));
    }
  }

  private parseResponse(raw: string): SurveyPlatformSuggestion[] {
    // Try to extract JSON array from response
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found in AI response');
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]) as SurveyPlatformSuggestion[];
      
      // Validate structure
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }

      // Validate each platform has required fields
      for (const platform of parsed) {
        if (!platform.platform || !platform.reason || !platform.postingStrategy || !platform.expectedReach || !platform.post) {
          throw new Error('Platform missing required fields');
        }
      }

      return parsed;
    } catch (parseError) {
      throw new Error(`Failed to parse AI response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  }
}
