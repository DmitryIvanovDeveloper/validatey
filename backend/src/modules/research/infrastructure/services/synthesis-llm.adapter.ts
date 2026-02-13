import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { SynthesisLlmPort } from '../../application/ports/synthesis-llm.port';
import type { SynthesisInput } from '../../application/ports/synthesis-llm.port';
import type { SynthesisReport } from '../../domain/value-objects/synthesis-report.vo';
import { SynthesisGenerationError } from '../../domain/errors/research.error';

const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a research analyst. Based on the provided project context (hypothesis, market, competitors, autocomplete/search intents, user insights, early signals), produce a well-formatted executive summary.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{"summary":"Write a 2-4 sentence executive summary that synthesizes all the research findings. Use clear, professional language with proper formatting including paragraphs where appropriate. Focus on key insights, market opportunities, and validation signals.","recommendations":["recommendation 1","recommendation 2",...]}

Rules:
- summary: Well-structured executive summary with proper formatting, paragraphs, and clear insights
- recommendations: 2-5 actionable recommendations based on the research
- Use English and professional business writing style`;

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
      `Early signals: ${input.earlySignalsSummary}`,
    ].join('\n\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nContext:\n${userContent}`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        { prompt: fullPrompt },
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
      return { summary: content.slice(0, 500), recommendations: [] };
    }
    try {
      const obj = JSON.parse(match[0]) as Record<string, unknown>;
      const summary = typeof obj.summary === 'string' ? obj.summary : '';
      const recommendations = Array.isArray(obj.recommendations)
        ? (obj.recommendations as string[]).filter((r) => typeof r === 'string')
        : [];
      return { summary: summary.trim(), recommendations };
    } catch {
      return { summary: '', recommendations: [] };
    }
  }
}
