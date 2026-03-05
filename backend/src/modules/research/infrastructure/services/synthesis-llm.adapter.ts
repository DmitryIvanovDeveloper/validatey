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
2. Analyze comment patterns from the provided comments to identify themes, validation signals, myths, and user feedback patterns. Include platform insights (dominant platforms, sentiment distribution, subreddit analysis if applicable).
3. SEPARATE Problem Validation from Solution Validation:
   - Problem Validation: Evidence that the stated problem exists and users suffer from it
   - Solution Validation: Evidence that users would adopt the proposed solution approach
   - Do NOT confuse pain point complaints with solution validation
4. Decide overall verdict: is the product idea validated, rejected, or does it need more data?
5. Write a clear summary and actionable recommendations so that each Key Assumption can later be assessed against this synthesis.

VALIDATION RULES:
- Hypothesis and comments are the MINIMUM sufficient input: you MUST always output a verdict and a short summary based on them, even when market/competitors/user insights are empty or "No ... yet".
- User insights (responses, quotes, pain points, willingness to pay) are the PRIMARY source when available; when absent, use comments and hypothesis only.
- Comment pattern analysis should identify validation/failure patterns with concrete examples.
- The "Comment Metrics" block shows exact, factual counts — treat these as ground truth when deciding the verdict.
  * When totalCount >= 10: comment data is sufficient — you MUST output a non-empty executive summary (2–4 sentences) and a verdict. Never leave summary empty when there are 10+ comments.
  * If totalCount >= 50 and your own commentPatternAnalysis.validationScore >= 70 and sentimentOverview.overall > 0.1, this constitutes STRONG social validation evidence — you SHOULD return "validated" unless user insights strongly contradict.
  * If totalCount < 10, treat comment data as insufficient and rely on other sources if present; if only hypothesis and comments are given, still produce verdict (often "needs-more-data") and a 1–2 sentence summary from the comments and hypothesis.
- Only return "validated" when substantial direct evidence supports the hypothesis.
- Only return "rejected" when evidence clearly contradicts or weakens the hypothesis.
- "needs-more-data" = more research needed before a decision can be made.
- Summary should cite specific evidence (e.g. comment themes, pain points, market signals) so that per-assumption assessment can refer to it. Never leave summary empty when comments or hypothesis are provided.

WAITLIST / LANDING SIGNUPS (use in the overall analysis, not just mention):
- When "Waitlist / landing signups" is provided in Context, treat it as SOLUTION VALIDATION evidence: real people chose to leave contact info for this idea. In the summary you MUST write the actual number from Context (e.g. if Context says "Waitlist / landing signups: 10", write "10 waitlist signups" or "10 signups" — never write the letter N or 0 unless that is the real number in Context).
  * When the number is > 0: counts as early interest and supports the hypothesis. Factor it into your verdict: e.g. if comments are mixed or "needs-more-data" but there are signups, the summary should state that waitlist signups are a positive early signal (citing the exact number) and weigh them in the conclusion. Do not ignore signups when deciding between "needs-more-data" and "validated" — they can tip the balance when other evidence is supportive.
  * When the count is 0 or not provided: if you would recommend "create a landing page", say so; if the project already has a landing but 0 signups, that can be a weak negative signal and can be noted in the summary.
- You MUST reflect waitlist in the executive summary as part of the evidence, using the exact number from Context (e.g. "…; the project has 10 waitlist signups, indicating early interest" or "…; no waitlist signups yet"). Do not recommend "create a landing page to measure interest" when signups already exist — instead recommend next steps that build on the existing signups (e.g. short survey to signups, interviews, or more traffic to the landing).

CONCLUSION RULES (use when deciding verdict and assumptions):
- Waitlist/landing signups (when provided and > 0) are early solution validation: they support the hypothesis that some people are interested. Weigh them together with comments and user insights when deciding verdict and when writing the summary; they can reinforce "validated" or make "needs-more-data" more optimistic.
- If the problem is widely discussed (many comments and/or many unique authors mentioning it) — treat as support for the relevant assumption (e.g. A1 confirmed).
- If people complain about lack of tools or solutions — that is evidence of unmet need / demand.
- If they actively respond to others' posts asking for advice or feedback — treat as an indirect signal of willingness to engage (not proof of willingness to pay or use a product).
- Many unique authors (dozens) expressing the same pain = stronger validation than the same number of comments from few authors.
- Recurrence: the same problem or theme appearing in multiple subreddits/communities is a STRONG validation signal — weight it positively when deciding verdict and assumptions.

COMMENT PATTERN ANALYSIS:
- Analyze all provided comments for recurring patterns and themes
- Identify: myths/beliefs, failures/frustrations, advice/suggestions, validation signals, feature requests, comparisons, workarounds, and emotions (disappointment, fear, hope — use type "emotion" when the main theme is emotional)
- Actively search for CONTRADICTORY evidence: skepticism, negative experiences, preference for alternatives, concerns about implementation
- Actively search for ALTERNATIVE APPROACHES (type "comparison" or "workaround"): how users already solve the problem without the product — e.g. "I just post in r/roastmystartup", "I pay experts on Fiverr", "we use internal reviews", "I ask friends". These show competitive context and workarounds; use type "comparison" or "workaround" and supportsHypothesis: false so they appear in "Alternative Approaches".
- Calculate validation score (0-100): higher score = stronger evidence of real user problems and validation signals, but REDUCED if contradictory evidence is found
- For each pattern include:
  - sentimentScore: -1 (very negative) to +1 (very positive), 0 = neutral
  - confidenceScore: 0-1 (AI confidence in pattern analysis)
  - recencyScore: 0-1 (how recent this pattern is)
- For each pattern provide a "keywords" array: 6–10 short phrases (ideally 2–3 words) that APPEAR in the comment texts you were given and specifically identify this pattern. PREFER PHRASES over single words because single words are ambiguous ("give", "exchange", "return", "honest" appear in many unrelated contexts). Good keywords for a feedback-seeking pattern: "honest feedback", "need feedback", "feedback on my", "roast my", "give critique", "constructive review". Bad keywords: "give", "honest", "feedback" (too common alone).
- CRITICAL — use phrases from actual comment text, not conceptual labels. Scan the comments and extract 2–3 word sequences that recur specifically in the comments matching this pattern.
- Each keyword phrase should distinguish THIS pattern from the others; a phrase appearing in every comment is useless.
- DO NOT include "commentIds" in your response; the server derives them automatically from keywords.
- The number of unique authors is computed server-side; higher keyword quality = more accurate results.
- Extract top 5-7 most significant patterns
- For each pattern include exactly ONE short example (max 120 chars). Do NOT include more than one example per pattern.
- CRITICAL u{2014} examples must be verbatim: the "content" in each example MUST be a direct substring copied from one of the numbered comments provided. DO NOT invent, paraphrase, or fabricate quotes. If no comment text matches this pattern, set "examples": []. The server validates every example against the comment list and discards any that do not match.
- Focus on patterns that are relevant to the hypothesis validation

ADDITIONAL ANALYTICS:
- Calculate overall sentiment (-1 to +1) and distribution (positive/neutral/negative percentages)
- Identify dominant platform and platform-specific insights
- Assess recent activity level (0-1) and trend direction (increasing/stable/decreasing)
- Provide platform distribution and sentiments

STRATEGIC RECOMMENDATIONS RULES (recommendations must be project-specific and stage-appropriate):
- Base every recommendation on the Context above: this project's hypothesis, segment, pain points, comment themes, and user insights. Do not output generic advice that could apply to any product.
- Match recommendations to the verdict you return:
  * If verdict is "needs-more-data": recommend validation steps that do NOT require building a product. Prefer: (1) surveys or short questionnaires on willingness/expectations, (2) 5–10 user interviews to test key assumptions, (3) concierge or manual test (you play the "product": e.g. broker feedback exchange by hand and measure who gives first), (4) landing page or fake-door (one page + "Sign up" / "I want in" to measure interest and optional 1–2 questions), (5) community experiment (e.g. post in a relevant forum offering a give-to-get exchange and observe who actually gives feedback first). Optionally add competitor/format research. Do NOT recommend building an MVP, prototype, or app until there is more validation.
  * If verdict is "validated": you may recommend next product steps (e.g. MVP scope, beta, positioning) only when the summary and patterns clearly support it; cite which pain points or assumptions justify each step.
  * If verdict is "rejected": recommend pivoting or re-scoping based on what the evidence showed (e.g. which assumption failed, what segment to try instead); do not recommend building the same idea.
- Preconditions for "Create MVP" / "Build next": only suggest when (1) verdict is "validated" or (2) at least 2–3 key assumptions are clearly supported by comments/user insights and you state that in the summary. Otherwise recommend more validation first.
- Phrase recommendations so they reference this project (e.g. "Given the demand for X in comments, consider a minimal MVP focused on Y" instead of "Create an MVP").
- Prefer 2–4 recommendations; fewer is fine if the evidence only supports that many. Do not pad with generic items.

Respond with ONLY valid JSON, no markdown. Use strictly valid JSON: no trailing commas in arrays or objects; escape any double quote inside a string with backslash (e.g. \\").
{
  "summary": "2-4 sentence executive summary with concrete evidence",
  "recommendations": ["2-5 actionable recommendations tied to this project and verdict"],
  "verdict": "validated"|"rejected"|"needs-more-data",
  "commentPatternAnalysis": {
    "totalComments": 184,
    "patterns": [
      {
        "type": "feedback_seeking",
        "label": "Pattern title (e.g., 'Users seek honest feedback')",
        "insight": "Detailed insight about this pattern",
        "count": 15,
        "percentage": 8.2,
        "sentimentScore": 0.3,
        "confidenceScore": 0.85,
        "recencyScore": 0.7,
        "supportsHypothesis": true,
        "keywords": ["honest feedback", "need feedback", "feedback on my", "give feedback", "roast my startup"],
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
        "HackerNews": 45
      },
      "platformSentiments": {
        "Reddit": 0.1,
        "HackerNews": 0.4
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

    const waitlistSection =
      input.waitlistSubscribersCount !== undefined && input.waitlistSubscribersCount !== null
        ? `Waitlist / landing signups: ${input.waitlistSubscribersCount}`
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
        ? `Comments numbered list (provide specific keywords per pattern so the server can match relevant comments):\n${input.commentsNumberedWithIds}`
        : '',
      `Early signals: ${input.earlySignalsSummary}`,
      input.academicPapersSummary ? `Academic research:\n${input.academicPapersSummary}` : '',
      input.productHuntSummary ? `Product Hunt:\n${input.productHuntSummary}` : '',
      waitlistSection,
      commentMetricsSection,
    ].filter(Boolean).join('\n\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nContext:\n${userContent}`;

    const maxRetries = 3;
    const baseDelayMs = 5000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
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
        const isRateLimit =
          message.includes('429') ||
          /rate\s*limit|too\s*many\s*requests|quota\s*exceeded/i.test(message);

        if (isRateLimit && attempt < maxRetries) {
          const delayMs = baseDelayMs * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        return ResultEx.failure(new SynthesisGenerationError(`Synthesis failed: ${message}`));
      }
    }

    return ResultEx.failure(new SynthesisGenerationError('Synthesis failed after retries'));
  }

  /**
   * Try to repair common LLM JSON mistakes (e.g. trailing commas) so that parse can succeed.
   * Does not guarantee valid JSON; used before throwing on parse failure.
   */
  private repairJsonString(raw: string): string {
    return raw
      .replace(/,\s*(\]|\})/g, '$1'); // remove trailing commas before ] or }
  }

  private parseJsonToReport(content: string): SynthesisReport {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new SynthesisGenerationError('LLM response contained no JSON object');
    }
    let jsonStr = match[0];
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch (firstErr) {
      jsonStr = this.repairJsonString(jsonStr);
      try {
        obj = JSON.parse(jsonStr) as Record<string, unknown>;
      } catch (secondErr) {
        const msg = firstErr instanceof Error ? firstErr.message : String(firstErr);
        throw new SynthesisGenerationError(`Invalid JSON from LLM (repair attempted): ${msg}`);
      }
    }
    try {
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
            type: typeof p.type === 'string' && p.type.trim() ? p.type.trim() : 'other',
            sentimentScore: typeof p.sentimentScore === 'number' ? Math.max(-1, Math.min(1, p.sentimentScore)) : 0,
            confidenceScore: typeof p.confidenceScore === 'number' ? Math.max(0, Math.min(1, p.confidenceScore)) : 0.5,
            recencyScore: typeof p.recencyScore === 'number' ? Math.max(0, Math.min(1, p.recencyScore)) : 0.5,
            supportsHypothesis: typeof p.supportsHypothesis === 'boolean' ? p.supportsHypothesis : undefined,
            // keywords provided by LLM; server uses them for deterministic comment matching
            keywords: Array.isArray(p.keywords)
              ? (p.keywords as unknown[]).filter((k): k is string => typeof k === 'string' && k.trim().length > 1).map((k) => k.toLowerCase().trim())
              : undefined,
            // commentIds intentionally not parsed from LLM; filled server-side via keyword matching
          }));

          commentPatternAnalysis = {
            totalComments: patternObj.totalComments,
            patterns,
            validationScore: patternObj.validationScore,
            sentimentOverview: patternObj.sentimentOverview || {
              overall: 0,
              distribution: { positive: 33, neutral: 34, negative: 33 }
            },
            platformInsights: patternObj.platformInsights || undefined,
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
      const msg = err instanceof Error ? err.message : String(err);
      if (err instanceof SynthesisGenerationError) throw err;
      throw new SynthesisGenerationError(`Synthesis report parse error: ${msg}`);
    }
  }
}
