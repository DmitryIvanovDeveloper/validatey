import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { AssumptionAssessmentLlmPort } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessmentInputItem } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessmentContext } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessment, AssumptionStatus } from '../../domain/value-objects/assumption-assessment.vo';

const AI_PROXY_URL = process.env.SYNTHESIS_LLM_URL || process.env.LLM_SERVICE_URL || 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a product research analyst. Your output appears in a product dashboard under "Key Assumptions". Each assumption gets a status and an evidence sentence shown directly to the founder.

Process EVERY assumption using the following 4 steps. Output ONLY the final JSON — do not output step-by-step reasoning.

STEP 1 — Identify audience groups from the hypothesis.
Read the "Project hypothesis". Extract every distinct audience the user mentions (e.g. "entrepreneurs", "potential users", "investors", "B2B buyers", "teachers", "developers" — whatever the hypothesis says). These are SEPARATE groups; data from one cannot confirm claims about another. If the hypothesis does not name any audience, treat the product as having one audience (e.g. "users" or "customers") and use that as the single group.

STEP 2 — For each assumption, identify the ACTOR GROUP and BEHAVIOR.
  ACTOR GROUP = match the subject of this assumption to one of the groups you listed in STEP 1.
    - Use the STEP 1 groups as the canonical list. Do NOT create new group names.
    - Strip all qualifiers from the assumption text. Examples:
        "Entrepreneurs in indie communities" → ACTOR GROUP = "entrepreneurs" (from STEP 1)
        "Early-stage investors" → ACTOR GROUP = "investors" (from STEP 1)
        "Potential users browsing the page" → ACTOR GROUP = "potential users" (from STEP 1)
  BEHAVIOR = what specific action or belief is being claimed about that group?

STEP 3 — Check audience coverage, then check behavior evidence.
The "Data sources" section starts with "AUDIENCE COVERAGE" — a pre-computed table. Read it first.
It shows exactly which audience groups have data and how many comments exist for each.

  3a. SOURCE audience match — find the ACTOR's coverage line by substring search.
      The AUDIENCE COVERAGE table uses slash-separated labels like:
        [audience: entrepreneurs / founders / indie hackers / solopreneurs / bootstrappers / startup founders / builders]
      To match: check if the ACTOR GROUP word appears anywhere inside the [audience: ...] label text.
      Examples:
        ACTOR = "founders"      → "founders" appears in the label above → MATCH ✓
        ACTOR = "indie hackers" → "indie hackers" appears in the label above → MATCH ✓
        ACTOR = "VCs"           → "VCs" appears in [audience: investors / VCs / ...] → MATCH ✓
        ACTOR = "end users"     → "end users" appears in [audience: potential users / end users / ...] → MATCH ✓
      If NO coverage line contains the ACTOR word → status = "need_more",
        evidence = "AUDIENCE COVERAGE has no data for [ACTOR GROUP] — collected data is from [list labels marked ✓]. Need [research type] with actual [ACTOR GROUP] respondents."
      If a matching line EXISTS and is marked ✓ → data from that audience exists → continue to 3b.

  3b. BEHAVIOR evidence — what do those comments say:
      From the comments block, look for direct evidence of BEHAVIOR from ACTOR audience.
      Direct evidence = people explicitly stating intent, describing actions, A/B results, beta feedback.
      NOT direct evidence = pain-point complaints, general frustrations, problem descriptions.
      If direct behavioral evidence found → status = "confirmed", cite the specific data.
      If NOT found → status = "need_more",
        evidence = "[ACTOR] pain/context IS confirmed — AUDIENCE COVERAGE shows [N] [ACTOR] comments from [sources]. Comments show [one sentence on what they say about the problem]. But behavioral evidence that [BEHAVIOR] occurs is missing — need [specific research: e.g. beta test / user interviews / A/B experiment]."

STEP 4 — Check for contradictions.
If comments or insights directly contradict the assumption → status = "not_supported", explain what the data says instead.

RULES:
- Evidence is REQUIRED for every assumption — never output null.
- Never infer behavior from pain: people complaining about a problem does NOT confirm they will use the proposed solution.
- validationScore confirms that the pain exists — not that anyone will take a specific action.
- Cross-audience inference is forbidden: data from audience A cannot confirm an assumption about a different audience B (whoever A and B are in this hypothesis).`;



const OUTPUT_SCHEMA = `Output format: JSON array only. Each element: {"assumptionId":"<exact id from input>","status":"confirmed"|"need_more"|"not_supported","evidence":"<required: 1-2 sentences explaining the status>"}.`;

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
      // Hypothesis first — so LLM can identify audience groups before reading assumptions
      `Project hypothesis (read this first to identify audience groups):\n${context.hypothesisSummary}`,
      '',
      'Assumptions (id + text):',
      assumptionsBlock,
      '',
      'Research context:',
      `Synthesis: ${context.synthesisSummary}`,
      `Verdict: ${context.verdict}`,
      `User insights: ${context.userInsightsSummary}`,
      context.dataSourcesSummary ? `Data sources:\n${context.dataSourcesSummary}` : '',
      `Comments: ${context.commentsSummary}`,
      context.commentPatternSummary ? `Comment patterns: ${context.commentPatternSummary}` : '',
      `Early signals: ${context.earlySignalsSummary}`,
      context.academicPapersSummary ? `Academic research:\n${context.academicPapersSummary}` : '',
    ].filter(Boolean).join('\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${OUTPUT_SCHEMA}\n\n---\n${userContent}`;

    try {
      // max_tokens scales with number of assumptions: ~300 tokens per assumption for evidence + status
      const maxTokens = Math.max(4096, assumptions.length * 350);
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: fullPrompt,
          model: 'llama3.3-70b',
          max_tokens: maxTokens,
        },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );

      const content = (response?.response ?? '').trim();
      if (!content) {
        console.error('[assumption-assessment-llm] empty response from LLM, prompt length:', fullPrompt.length);
        return ResultEx.success(this.fallbackAssessments(assumptions, context.verdict));
      }

      const hasArray = /\[[\s\S]*\]/.test(content);
      if (!hasArray) {
        console.error('[assumption-assessment-llm] no JSON array found, content preview:', content.slice(0, 400));
      }

      const parsed = this.parseJsonToAssessments(content, assumptions);
      return ResultEx.success(parsed);
    } catch (err) {
      console.error('[assumption-assessment-llm] exception:', err);
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
      const resultMap = new Map<string, AssumptionAssessment>();

      for (const item of arr) {
        if (item == null || typeof item !== 'object') continue;
        const o = item as Record<string, unknown>;
        const assumptionId = typeof o.assumptionId === 'string' ? o.assumptionId : '';
        if (!idSet.has(assumptionId)) continue;
        const status = statusSet.has(o.status as AssumptionStatus) ? (o.status as AssumptionStatus) : 'need_more';
        const evidence = typeof o.evidence === 'string' ? o.evidence : null;
        resultMap.set(assumptionId, { assumptionId, status, evidence });
      }

      // Preserve partial results — fill missing assumptions with need_more instead of discarding all
      return assumptions.map((a) =>
        resultMap.get(a.assumptionId) ?? { assumptionId: a.assumptionId, status: 'need_more', evidence: null }
      );
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
