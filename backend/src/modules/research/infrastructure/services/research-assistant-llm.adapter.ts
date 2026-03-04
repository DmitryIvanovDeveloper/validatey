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

const SYSTEM_PROMPT = `You are an AI research assistant for product validation. The user is a PM doing research. You have access to recent comments from external sources (like HackerNews, Reddit) that may contain relevant insights, user feedback, or similar experiences.

You may also have access to enhanced Comment Pattern Analysis - AI-powered analysis of user feedback patterns that identifies common themes, sentiment analysis, confidence scores, and platform-specific insights.

When responding:
- Consider the provided comments as real user feedback and incorporate relevant insights from them
- Use Comment Pattern Analysis to identify patterns, sentiment trends, and platform differences
- Pay attention to confidence scores (higher = more reliable) and recency scores (higher = more current)
- Consider overall sentiment and platform distribution when making recommendations
- Reference specific patterns and their sentiment scores when they support your recommendations
- Use the validation score and temporal trends to assess hypothesis strength
- Reply briefly and practically
- If they ask for market analysis or methods, suggest 1-3 concrete methods (e.g. "conjoint analysis", "survey", "A/B test")
- Optionally ask 1-2 clarifying questions (geography, segment, budget)

Respond with ONLY a valid JSON object (no markdown): {"reply":"your reply text","suggestedMethods":["method1",...],"clarificationQuestions":["q1",...]}. Omit suggestedMethods or clarificationQuestions if not relevant. Use English.`;

@injectable()
export class ResearchAssistantLlmAdapter implements ResearchAssistantLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async reply(userMessage: string, context: ResearchAssistantContext): Promise<ResultEx<AssistantReply, Error>> {
    let userContent = `Project: ${context.projectName}\nHypothesis: ${context.hypothesisSummary}\n\n`;

    // Add comments if available
    if (context.comments && context.comments.length > 0) {
      userContent += `Recent Comments (${context.comments.length}):\n`;
      context.comments.forEach((comment, index) => {
        userContent += `${index + 1}. "${comment.content}"`;
        if (comment.author) userContent += ` - ${comment.author}`;
        if (comment.contextTitle) userContent += ` (from: ${comment.contextTitle})`;
        userContent += '\n';
      });
      userContent += '\n';
    }

    // Add comment pattern analysis if available
    if (context.commentPatternAnalysis) {
      const analysis = context.commentPatternAnalysis;
      userContent += `Comment Pattern Analysis (from ${analysis.totalComments} comments, validation score: ${analysis.validationScore}/100):\n\n`;

      // Overall sentiment and platform insights
      userContent += `Overall Sentiment: ${analysis.sentimentOverview.overall > 0.1 ? 'Positive' : analysis.sentimentOverview.overall < -0.1 ? 'Negative' : 'Neutral'} (${analysis.sentimentOverview.distribution.positive}% positive, ${analysis.sentimentOverview.distribution.negative}% negative)\n`;
      if (analysis.platformInsights) {
        userContent += `Dominant Platform: ${analysis.platformInsights.dominantPlatform}\n`;
      }
      userContent += `Recent Activity: ${analysis.temporalTrends.recentActivity > 0.7 ? 'High' : analysis.temporalTrends.recentActivity > 0.3 ? 'Medium' : 'Low'} (${analysis.temporalTrends.trendDirection} trend)\n\n`;

      // Individual patterns with enhanced metrics
      userContent += `Key Patterns:\n`;
      analysis.patterns.forEach((pattern, index) => {
        const sentiment = pattern.sentimentScore > 0.2 ? '🔥' : pattern.sentimentScore < -0.2 ? '😞' : '😐';
        const confidence = pattern.confidenceScore > 0.8 ? 'High' : pattern.confidenceScore > 0.6 ? 'Medium' : 'Low';
        const recency = pattern.recencyScore > 0.8 ? 'Recent' : pattern.recencyScore > 0.5 ? 'Current' : 'Older';

        userContent += `${index + 1}. ${pattern.label} (${pattern.count} mentions, ${pattern.percentage}%) ${sentiment}\n`;
        userContent += `   Type: ${pattern.type} | Sentiment: ${pattern.sentimentScore.toFixed(1)} | Confidence: ${confidence} | Recency: ${recency}\n`;
        userContent += `   Insight: ${pattern.insight}\n`;

        if (pattern.examples && pattern.examples.length > 0) {
          pattern.examples.slice(0, 2).forEach((example, exIndex) => {
            userContent += `   Example ${exIndex + 1}: "${example.content}" - ${example.author} (${example.source})\n`;
          });
        }
        userContent += '\n';
      });
      userContent += '\n';
    }

    userContent += `User: ${userMessage}`;
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
