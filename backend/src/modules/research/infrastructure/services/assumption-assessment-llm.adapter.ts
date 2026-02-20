import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { AssumptionAssessmentLlmPort } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessmentInputItem } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessmentContext } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessment, AssumptionStatus } from '../../domain/value-objects/assumption-assessment.vo';

const AI_PROXY_URL = process.env.SYNTHESIS_LLM_URL || process.env.LLM_SERVICE_URL || 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a research analyst. Your output is shown on the project Overview under "Key Assumptions": each assumption gets a status (Confirmed / Need more data / Not supported) and a short evidence text that explains why.

For EACH key assumption in the list:
1. Read the assumption text and its assumptionId.
2. Check the research context: synthesis summary, verdict, user insights, early signals.
3. Assign exactly one status:
   - confirmed: the context clearly supports this assumption (cite what supports it).
   - need_more: not enough data to judge, or mixed signals; say what is missing or unclear.
   - not_supported: the context contradicts or weakens this assumption; say why.
4. Write evidence: 1-2 short sentences in English, user-facing. Explain what in the research supports the status (e.g. "Comment themes show X; recommend Y to validate."). Use null only if you cannot say anything useful.

RULES:
- Output ONLY a JSON array. One object per assumption. Use the exact assumptionId from the input (copy-paste the id).
- Order of the array must match the order of assumptions in the input.
- Evidence is displayed directly to the user; keep it clear, neutral, and actionable.
- If synthesis says "no user insights yet", most assumptions should be need_more with evidence like "No user responses yet; run invitations to validate."`;

const OUTPUT_SCHEMA = `Output format: JSON array only. Each element: {"assumptionId":"<same id as input>","status":"confirmed"|"need_more"|"not_supported","evidence":"1-2 sentences or null"}.`;

@injectable()
export class AssumptionAssessmentLlmAdapter implements AssumptionAssessmentLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async generate(
    assumptions: ReadonlyArray<AssumptionAssessmentInputItem>,
    context: AssumptionAssessmentContext
  ): Promise<ResultEx<AssumptionAssessment[], Error>> {
    const assumptionsBlock = assumptions
      .map((a) => `[${a.assumptionId}] ${a.text}`)
      .join('\n');
    const userContent = [
      'Assumptions (id + text):',
      assumptionsBlock,
      '',
      'Research context:',
      `Synthesis: ${context.synthesisSummary}`,
      `Verdict: ${context.verdict}`,
      `User insights: ${context.userInsightsSummary}`,
      `Early signals: ${context.earlySignalsSummary}`,
    ].join('\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${OUTPUT_SCHEMA}\n\n---\n${userContent}`;

    try {
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: fullPrompt,
          model: 'llama3.1-8b',
        },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );

      const content = (response?.response ?? '').trim();
      if (!content) {
        return ResultEx.success(this.fallbackAssessments(assumptions, context.verdict));
      }

      const parsed = this.parseJsonToAssessments(content, assumptions);
      return ResultEx.success(parsed);
    } catch (err) {
      return ResultEx.success(this.fallbackAssessments(assumptions, context.verdict));
    }
  }

  private parseJsonToAssessments(
    content: string,
    assumptions: ReadonlyArray<AssumptionAssessmentInputItem>
  ): AssumptionAssessment[] {
    const match = content.match(/\[[\s\S]*\]/);
    if (!match) {
      return this.fallbackAssessments(assumptions, '');
    }
    try {
      const arr = JSON.parse(match[0]) as unknown[];
      if (!Array.isArray(arr)) return this.fallbackAssessments(assumptions, '');
      const idSet = new Set(assumptions.map((a) => a.assumptionId));
      const statusSet = new Set<AssumptionStatus>(['confirmed', 'need_more', 'not_supported']);
      const result: AssumptionAssessment[] = [];
      for (const item of arr) {
        if (item == null || typeof item !== 'object') continue;
        const o = item as Record<string, unknown>;
        const assumptionId = typeof o.assumptionId === 'string' ? o.assumptionId : '';
        if (!idSet.has(assumptionId)) continue;
        const status = statusSet.has(o.status as AssumptionStatus) ? (o.status as AssumptionStatus) : 'need_more';
        const evidence = typeof o.evidence === 'string' ? o.evidence : null;
        result.push({ assumptionId, status, evidence });
      }
      if (result.length === assumptions.length) return result;
      return this.fallbackAssessments(assumptions, '');
    } catch {
      return this.fallbackAssessments(assumptions, '');
    }
  }

  private fallbackAssessments(
    assumptions: ReadonlyArray<AssumptionAssessmentInputItem>,
    verdict: string
  ): AssumptionAssessment[] {
    const v = String(verdict).toLowerCase().replace(/-/g, '_');
    const status: AssumptionStatus =
      v === 'validated' || v === 'strong_validation' ? 'confirmed'
        : v === 'rejected' ? 'not_supported'
        : 'need_more';
    return assumptions.map((a) => ({
      assumptionId: a.assumptionId,
      status,
      evidence: null as string | null,
    }));
  }
}
