import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { SynthesisLlmPort } from '../../application/ports/synthesis-llm.port';
import type { SynthesisInput } from '../../application/ports/synthesis-llm.port';
import type { SynthesisReport } from '../../domain/value-objects/synthesis-report.vo';
import { SynthesisGenerationError } from '../../domain/errors/research.error';

/** Override via SYNTHESIS_LLM_URL if cerebras-api.vercel.app fails (e.g. llama-3.3-70b model not available) */
const AI_PROXY_URL = process.env.SYNTHESIS_LLM_URL || 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a research analyst specializing in product validation. Your output will be used to show an executive summary on the project Overview and to assess each Key Assumption (Confirmed / Need more data / Not supported) with evidence.

TASK:
1. Synthesize all provided context: hypothesis, market, competitors, search intents, user insights, comments, comment patterns (if available), early signals.
2. Decide overall verdict: is the product idea validated, rejected, or does it need more data?
3. Write a clear summary and actionable recommendations so that each Key Assumption can later be assessed against this synthesis.

VALIDATION RULES:
- User insights (responses, quotes, pain points, willingness to pay) are the PRIMARY source.
- Comment pattern analysis with validation score >= 70 is STRONG evidence (treat as validated if score >= 80).
- If comment patterns show validation/failure patterns, use them to inform verdict.
- Only return "validated" when substantial direct user evidence OR strong comment patterns (score >= 80) support the hypothesis.
- Only return "rejected" when evidence clearly contradicts or weakens the hypothesis.
- "needs-more-data" = more user research or data collection needed before a decision.
- Summary should cite specific evidence (e.g. comment themes, pain points, validation patterns, market signals) so that per-assumption assessment can refer to it.

Respond with ONLY valid JSON, no markdown:
{"summary":"2-4 sentence executive summary with concrete evidence","recommendations":["2-5 actionable recommendations"],"verdict":"validated"|"rejected"|"needs-more-data"}`;

@injectable()
export class SynthesisLlmAdapter implements SynthesisLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async generateSynthesis(input: SynthesisInput): Promise<ResultEx<SynthesisReport, SynthesisGenerationError>> {
    const userContent = [
      `Project: ${input.projectName}`,
      `Hypothesis: ${input.hypothesisSummary}`,
      `Market: ${input.marketSummary}`,
      `Competitors: ${input.competitorSummary}`,
      `Search intents (Google Autocomplete): ${input.autocompleteSummary}`,
      `User insights: ${input.userInsightsSummary}`,
      `Comments: ${input.commentsSummary}`,
      input.commentPatternSummary ? `Comment patterns: ${input.commentPatternSummary}` : '', // NEW: Add pattern analysis if available
      `Early signals: ${input.earlySignalsSummary}`,
    ].filter(Boolean).join('\n\n'); // Filter out empty strings

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nContext:\n${userContent}`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: fullPrompt,
          model: 'llama3.1-8b'
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
      return { summary: summary.trim(), recommendations, verdict };
    } catch {
      return { summary: '', recommendations: [], verdict: 'needs-more-data' };
    }
  }
}
