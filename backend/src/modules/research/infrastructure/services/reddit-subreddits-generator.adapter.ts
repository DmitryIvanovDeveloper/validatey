import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { RedditSubredditsGeneratorPort } from '../../application/ports/reddit-subreddits-generator.port';
import type { ResearchIntent } from '../../application/use-cases/input-output/collect-research-data.io';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a Reddit community expert specializing in startup and product validation research. Your task is to suggest the most relevant subreddits for finding authentic user discussions and feedback about a specific product hypothesis.

RULES FOR SUBREDDIT SELECTION:
- Generate 5-12 subreddit names (without r/ prefix)
- Focus on active communities where users genuinely discuss problems and solutions
- Include mix of domain-specific and general startup communities
- Prioritize technical communities over marketing/promotional ones
- Prefer subreddits with high-quality, thoughtful discussions
- Avoid spam-heavy or low-quality communities

SUBREDDIT CATEGORIES TO CONSIDER:
- Domain-specific: communities directly related to the problem space
- Startup/Product: r/startups, r/buildinpublic, r/Entrepreneur, r/indiehackers
- Technical: r/programming, r/softwaredevelopment, r/ProductManagement
- Industry-specific: relevant to the product's target market
- User communities: where target users discuss their challenges

QUALITY CRITERIA:
- Communities should have active, engaged users
- Avoid subreddits focused on memes, jokes, or low-effort content
- Prefer subreddits with good moderation and signal-to-noise ratio
- Include communities where users ask for advice and share experiences

Return only a valid JSON array of subreddit names, e.g.: ["startups", "buildinpublic", "SaaS", "ProductManagement", "indiehackers"]`;

@injectable()
export class RedditSubredditsGeneratorAdapter implements RedditSubredditsGeneratorPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async generateSubreddits(intent: ResearchIntent): Promise<ResultEx<string[], Error>> {
    const topic = (intent.topic ?? '').trim();
    if (!topic) {
      return ResultEx.success([]);
    }

    const context = [
      `Hypothesis/Topic: ${topic}`,
      intent.productDescription ? `Product: ${intent.productDescription}` : '',
      intent.segment ? `Target Segment: ${intent.segment}` : '',
      intent.geography ? `Geography: ${intent.geography}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const userContent = `Based on this product hypothesis, suggest the most relevant Reddit communities for finding authentic user discussions and feedback.

Context:
${context}

Generate subreddit names that would contain valuable insights from users facing similar problems or discussing related solutions.`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: `${SYSTEM_PROMPT}\n\n---\n${userContent}`,
          model: 'llama3.3-70b',
          max_tokens: 256,
        },
        {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)',
        }
      );

      const content = (response?.response ?? '').trim();
      const subreddits = this.parseSubreddits(content);

      return ResultEx.success(subreddits);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new Error(`Reddit subreddits generation failed: ${message}`));
    }
  }

  private parseSubreddits(content: string): string[] {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) return [];

    try {
      const arr = JSON.parse(match[0]) as unknown[];
      if (!Array.isArray(arr)) return [];

      return arr
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .map(name => name.trim().replace(/^r\//, '')) // Remove r/ prefix if present
        .filter(name => name.length > 0 && name.length <= 50) // Reasonable name length
        .slice(0, 12); // Limit to 12 subreddits max
    } catch {
      return [];
    }
  }
}