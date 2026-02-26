import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { SynthesisLlmPort } from '../../application/ports/synthesis-llm.port';
import type { SynthesisInput } from '../../application/ports/synthesis-llm.port';
import type { SynthesisReport } from '../../domain/value-objects/synthesis-report.vo';
import type { CommentPatternAnalysis } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';
import { SynthesisGenerationError } from '../../domain/errors/research.error';

/** Override via SYNTHESIS_LLM_URL if cerebras-api.vercel.app fails (e.g. llama-3.3-70b model not available) */
const AI_PROXY_URL = process.env.SYNTHESIS_LLM_URL || 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a research analyst specializing in product validation. Your output will be used to show an executive summary on the project Overview and to assess each Key Assumption (Confirmed / Need more data / Not supported) with evidence.

TASK:
1. Synthesize all provided context: hypothesis, market, competitors, search intents, user insights, comments, early signals.
2. Analyze comment patterns from the provided comments to identify themes, validation signals, myths, and user feedback patterns.
3. Decide overall verdict: is the product idea validated, rejected, or does it need more data?
4. Write a clear summary and actionable recommendations so that each Key Assumption can later be assessed against this synthesis.

VALIDATION RULES:
- User insights (responses, quotes, pain points, willingness to pay) are the PRIMARY source.
- Comment pattern analysis should identify validation/failure patterns with concrete examples.
- The "Comment Metrics" block shows exact, factual counts — treat these as ground truth when deciding the verdict.
  * If totalCount >= 50 and your own commentPatternAnalysis.validationScore >= 70 and sentimentOverview.overall > 0.1, this constitutes STRONG social validation evidence — you SHOULD return "validated" unless user insights strongly contradict.
  * If totalCount < 10, treat comment data as insufficient and rely on other sources.
- Only return "validated" when substantial direct evidence supports the hypothesis.
- Only return "rejected" when evidence clearly contradicts or weakens the hypothesis.
- "needs-more-data" = more research needed before a decision can be made.
- Summary should cite specific evidence (e.g. comment themes, pain points, market signals) so that per-assumption assessment can refer to it.

COMMENT PATTERN ANALYSIS:
- Analyze all provided comments for recurring patterns and themes
- Identify: myths/beliefs, failures/frustrations, advice/suggestions, validation signals, feature requests, comparisons, workarounds
- Calculate validation score (0-100): higher score = stronger evidence of real user problems and validation signals
- For each pattern include:
  - sentimentScore: -1 (very negative) to +1 (very positive), 0 = neutral
  - confidenceScore: 0-1 (AI confidence in pattern analysis)
  - recencyScore: 0-1 (how recent this pattern is)
- Extract top 5-7 most significant patterns
- For each pattern include exactly ONE short example (max 120 chars). Do NOT include more than one example per pattern.
- A numbered list of comments is provided with format "N. [id: <uuid>] \"preview\"". For each pattern set commentIds to an array of those exact UUID strings (the <uuid> part) for every comment that belongs to this pattern. Use as many as apply; do not limit to one.
- Focus on patterns that are relevant to the hypothesis validation

ADDITIONAL ANALYTICS:
- Calculate overall sentiment (-1 to +1) and distribution (positive/neutral/negative percentages)
- Identify dominant platform and platform-specific insights
- Assess recent activity level (0-1) and trend direction (increasing/stable/decreasing)
- Provide platform distribution and sentiments

Respond with ONLY valid JSON, no markdown:
{
  "summary": "2-4 sentence executive summary with concrete evidence",
  "recommendations": ["2-5 actionable recommendations"],
  "verdict": "validated"|"rejected"|"needs-more-data",
  "commentPatternAnalysis": {
    "totalComments": 184,
    "patterns": [
      {
        "type": "validation"|"myth"|"failure"|"advice"|"feature_request"|"comparison"|"workaround",
        "label": "Pattern title (e.g., 'Users want dark mode')",
        "insight": "Detailed insight about this pattern",
        "count": 15,
        "percentage": 8.2,
        "sentimentScore": 0.3,
        "confidenceScore": 0.85,
        "recencyScore": 0.7,
        "commentIds": ["uuid-from-list-1", "uuid-from-list-2"],
        "examples": [{"content": "one short quote max 120 chars", "author": "Anonymous", "source": "Reddit"}]
      }
    ],
    "validationScore": 75,
    "sentimentOverview": {
      "overall": 0.2,
      "distribution": {
        "positive": 35,
        "neutral": 40,
        "negative": 25
      }
    },
    "platformInsights": {
      "dominantPlatform": "Reddit",
      "platformDistribution": {
        "Reddit": 120,
        "HackerNews": 45,
        "LinkedIn": 19
      },
      "platformSentiments": {
        "Reddit": 0.1,
        "HackerNews": 0.4,
        "LinkedIn": 0.0
      }
    },
    "temporalTrends": {
      "recentActivity": 0.8,
      "trendDirection": "increasing"
    },
    "analyzedAt": "2024-01-01T00:00:00Z"
  }
}`;

@injectable()
export class SynthesisLlmAdapter implements SynthesisLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async generateSynthesis(input: SynthesisInput): Promise<ResultEx<SynthesisReport, SynthesisGenerationError>> {
    const commentMetricsSection = input.commentMetrics
      ? [
          `Comment Metrics (factual counts — use as ground truth for verdict):`,
          `  Total comments analyzed: ${input.commentMetrics.totalCount}`,
          ...Object.entries(input.commentMetrics.bySource).map(
            ([src, cnt]) => `  ${src}: ${cnt}`
          ),
        ].join('\n')
      : '';

    const userContent = [
      `Project: ${input.projectName}`,
      `Hypothesis: ${input.hypothesisSummary}`,
      `Market: ${input.marketSummary}`,
      `Competitors: ${input.competitorSummary}`,
      `Search intents (Google Autocomplete): ${input.autocompleteSummary}`,
      `User insights: ${input.userInsightsSummary}`,
      `Comments: ${input.commentsSummary}`,
      input.commentsNumberedWithIds
        ? `Comments numbered list (use the [id: <uuid>] values in commentIds for each pattern):\n${input.commentsNumberedWithIds}`
        : '',
      `Early signals: ${input.earlySignalsSummary}`,
      input.academicPapersSummary ? `Academic research:\n${input.academicPapersSummary}` : '',
      input.productHuntSummary ? `Product Hunt:\n${input.productHuntSummary}` : '',
      commentMetricsSection,
    ].filter(Boolean).join('\n\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nContext:\n${userContent}`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: fullPrompt,
          model: 'llama3.3-70b',
          max_tokens: 8192,
        },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );

      const content = (response?.response ?? '').trim();
      if (!content) {
        return ResultEx.failure(new SynthesisGenerationError('Empty response from LLM'));
      }

      const report = this.parseJsonToReport(content);
      return ResultEx.success(report);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return ResultEx.failure(new SynthesisGenerationError(`Synthesis failed: ${message}`));
    }
  }

  private parseJsonToReport(content: string): SynthesisReport {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      return { summary: content.slice(0, 500), recommendations: [], verdict: 'needs-more-data' };
    }
    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const summary = typeof obj.summary === 'string' ? obj.summary : '';
      const recommendations = Array.isArray(obj.recommendations)
        ? (obj.recommendations as string[]).filter((r) => typeof r === 'string')
        : [];
      const verdict = (obj.verdict === 'validated' || obj.verdict === 'rejected' || obj.verdict === 'needs-more-data')
        ? obj.verdict as 'validated' | 'rejected' | 'needs-more-data'
        : 'needs-more-data';

      // Parse comment pattern analysis if present
      let commentPatternAnalysis: CommentPatternAnalysis | undefined;
      if (obj.commentPatternAnalysis && typeof obj.commentPatternAnalysis === 'object') {
        const patternObj = obj.commentPatternAnalysis as any;
        if (patternObj.totalComments && Array.isArray(patternObj.patterns) && typeof patternObj.validationScore === 'number') {
          // Ensure pattern scores have defaults
          const patterns = patternObj.patterns.map((p: any) => ({
            ...p,
            sentimentScore: typeof p.sentimentScore === 'number' ? Math.max(-1, Math.min(1, p.sentimentScore)) : 0,
            confidenceScore: typeof p.confidenceScore === 'number' ? Math.max(0, Math.min(1, p.confidenceScore)) : 0.5,
            recencyScore: typeof p.recencyScore === 'number' ? Math.max(0, Math.min(1, p.recencyScore)) : 0.5,
            commentIds: Array.isArray(p.commentIds)
              ? p.commentIds.filter((id: any) => typeof id === 'string' && id.length > 10)
              : [],
          }));

          commentPatternAnalysis = {
            totalComments: patternObj.totalComments,
            patterns,
            validationScore: patternObj.validationScore,
            sentimentOverview: patternObj.sentimentOverview || {
              overall: 0,
              distribution: { positive: 33, neutral: 34, negative: 33 }
            },
            platformInsights: patternObj.platformInsights || {
              dominantPlatform: 'Unknown',
              platformDistribution: {},
              platformSentiments: {}
            },
            temporalTrends: patternObj.temporalTrends || {
              recentActivity: 0.5,
              trendDirection: 'stable' as const
            },
            analyzedAt: new Date(),
          };
        }
      }

      return {
        summary: summary.trim(),
        recommendations,
        verdict,
        commentPatternAnalysis
      };
    } catch (err) {
      // Log parse failure for diagnostics but don't crash — return safe fallback
      console.error('[synthesis-llm] JSON parse failed:', err instanceof Error ? err.message : String(err));
      return { summary: '', recommendations: [], verdict: 'needs-more-data' };
    }
  }
}
