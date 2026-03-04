import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { AssumptionAssessmentLlmPort } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessmentInputItem } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessmentContext } from '../../application/ports/assumption-assessment-llm.port';
import type { AssumptionAssessment, AssumptionStatus } from '../../domain/value-objects/assumption-assessment.vo';

const AI_PROXY_URL = process.env.SYNTHESIS_LLM_URL || process.env.LLM_SERVICE_URL || 'https://cerebras-api.vercel.app/api/prompt';

// Use configurable model for analysis - defaults to llama3.3-70b, can be set to gpt-4-turbo for larger context
const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL || 'llama3.3-70b';

const SYSTEM_PROMPT = `You are a product research analyst. Your output appears in a product dashboard under "Key Assumptions". Each assumption gets a status and an evidence sentence shown directly to the founder.

CRITICAL — You MUST use these five statuses. No other values allowed:
- "confirmed" = direct evidence from data supports the assumption
- "need_more" = attitudinal assumption with no or insufficient evidence yet (more research can help)
- "not_supported" = evidence contradicts the assumption
- "not_testable" = this assumption CANNOT be validated from forum/comment data (e.g. retention, conversion, return behavior). Use this for behavioral assumptions. Never use "confirmed" for behavioral claims based only on comments.
- "disproven" = evidence clearly contradicts the assumption (stronger than not_supported when data explicitly refutes)

Process EVERY assumption using the following 4 steps. Output ONLY the final JSON — do not output step-by-step reasoning.

STEP 1 — Identify audience groups from the hypothesis.
Read the "Project hypothesis". Extract every distinct audience the user mentions (e.g. "entrepreneurs", "potential users", "investors", "B2B buyers", "teachers", "developers" — whatever the hypothesis says). These are SEPARATE groups; data from one cannot confirm claims about another. If the hypothesis does not name any audience, treat the product as having one audience (e.g. "users" or "customers") and use that as the single group.

STEP 2 — For each assumption, identify the ACTOR GROUP, BEHAVIOR TYPE, and EVIDENCE REQUIREMENTS.
  ACTOR GROUP = the human audience group that performs the action or holds the belief.
    - ACTOR must always be a group of people (e.g. "founders", "users", "investors") — NEVER a topic, a fear, or an abstract concept (e.g. "fear of idea theft" is NOT an actor; the actor is "founders" who fear it).
    - Match ACTOR to one of the groups from STEP 1. Use the STEP 1 list as canonical; do NOT invent new group names.
    - Strip all qualifiers: "Entrepreneurs in indie communities" → "entrepreneurs"; "Early-stage investors" → "investors".

  BEHAVIOR TYPE = classify each assumption:
    - ATTITUDINAL: beliefs, preferences, pain points, willingness to pay, feature preferences
    - BEHAVIORAL: actual actions (retention, conversion, return usage, engagement patterns)

  EVIDENCE REQUIREMENTS:
    - ATTITUDINAL: can be validated from forum comments, surveys, interviews
    - BEHAVIORAL: requires behavioral data (analytics, A/B tests, retention metrics) — forum comments are INSUFFICIENT

STEP 3 — Check audience coverage, then check behavior evidence.
The "Data sources" section starts with "Total comments in this analysis: N" and then "AUDIENCE COVERAGE". Read both.
      - The "THEMATIC COUNTS" block gives rough keyword-proximity estimates of how many comments may relate to each assumption. These are NOT semantic matches — they use multi-word phrase proximity and may include false positives. Use them as approximate context ("roughly N of [total] comments may touch this topic"), NOT as definitive facts.
      - Comments block shows filtered, relevant comments (up to 25 per source). If the sample shows that most comments are clearly about unrelated topics (e.g. job postings, unrelated tech debates), report that and set status = "need_more" — the thematic count is unreliable in that case.
      - Do NOT cite only a subset of sources (e.g. "6 from r/X, r/Y") — cite the thematic count and total, with the caveat that counts are estimates.

  3a. SOURCE audience match — check the ACTOR GROUP against the AUDIENCE COVERAGE table.
      The table uses slash-separated labels, e.g.:
        [audience: entrepreneurs / founders / indie hackers / solopreneurs / bootstrappers / startup founders / builders]
      MATCH RULE: if the ACTOR word (or any close synonym) appears ANYWHERE inside the [audience: ...] label text → it is a MATCH. "founders" inside "entrepreneurs / founders / ..." → MATCH ✓.
      IMPORTANT: "entrepreneurs", "founders", "indie hackers", "startup founders", "solopreneurs", "builders" all refer to the SAME audience group in this table. If the assumption is about "founders" and the table has a ✓ line with "founders" in the label, that is a MATCH — do NOT write "no data for founders".
      If a matching ✓ line EXISTS → continue to 3b.
      Only if NO line in the whole table contains the ACTOR word → status = "need_more",
        evidence = "No comments collected about [ACTOR GROUP] — data covers [list ✓ labels]. Need [research type] with [ACTOR GROUP]."

  SURVEY DATA INTERPRETATION: If "User insights" contains survey data, apply these rules STRICTLY:

  For PAIN/PROBLEM assumptions (e.g. "professionals spend significant time searching"):
  - Average severity >= 7/10 → evidence SUPPORTS the assumption → status may be "confirmed"
  - Average severity 4–6/10 → weak signal → status = "need_more"
  - Average severity <= 3/10 → evidence CONTRADICTS the assumption → status = "not_supported"

  For WILLINGNESS TO PAY assumptions:
  - Average WTP >= $5/month → evidence SUPPORTS → status may be "confirmed"
  - Average WTP $1–4/month → weak signal → status = "need_more"
  - Average WTP = $0 OR users explicitly say they would not pay → status = "not_supported"

  For BEHAVIORAL WILLINGNESS (e.g. "willing to configure", "willing to set up preferences"):
  - Look at text responses directly. If users say "yes I would configure" / "I would set up keywords" → supports
  - If users say "no I would not configure" / "too much effort" / "not interested" → contradicts → "not_supported"
  - WTP score alone does NOT confirm willingness to configure — these are different assumptions

  DATA RELEVANCE WARNING: If the data source summary includes a LOW_RELEVANCE WARNING flag for COMMENTS, treat the COMMENT-BASED thematic counts as unreliable. However, SURVEY RESPONSES in the "User insights" field are INDEPENDENT evidence — they are direct first-person answers from real users and MUST be evaluated separately using the thresholds above.

  3b. BEHAVIOR vs ATTITUDE evidence — distinguish between what people SAY and what they DO.
      ATTITUDE evidence (what people think/feel): pain complaints, frustrations, opinions, preferences.
      BEHAVIOR evidence (what people actually do): usage patterns, return rates, conversion actions, A/B results, beta feedback.

      For BEHAVIORAL assumptions (retention, engagement, conversion):
      - If direct behavioral evidence found → status = "confirmed"
      - If only attitude evidence → status = "not_testable"
      - If no evidence → status = "not_testable"
      - Forum comments CANNOT validate behavioral assumptions

      For ATTITUDINAL assumptions (preferences, pain points, willingness):
      - If attitude evidence found → status = "confirmed"
      - If no evidence → status = "need_more"
      - Contradictory evidence → status = "disproven"

STEP 4 — Check for contradictions.
If comments or insights directly contradict the assumption → status = "not_supported", explain what the data says instead.

CONCLUSION RULES:
- If the problem is widely discussed (many comments and/or many unique authors) — treat as support for the relevant assumption when the actor group matches.
- If people complain about lack of tools/solutions — that is evidence of unmet need (you may cite it as context; it does not by itself confirm willingness to use a specific product).
- If they actively respond to others asking for advice — treat as an indirect signal of engagement, not proof of behavior.
- When comment patterns include unique author counts: many unique authors (e.g. dozens) expressing the same pain = stronger validation than the same number of comments from few people.

RULES:
- Evidence is REQUIRED for every assumption — never output null.
- Never infer behavior from pain: people complaining about a problem does NOT confirm they will use the proposed solution.
- validationScore confirms that the pain exists — not that anyone will take a specific action.
- Cross-audience inference is forbidden: data from audience A cannot confirm an assumption about a different audience B (whoever A and B are in this hypothesis).`;



const OUTPUT_SCHEMA = `Output format: JSON array only. Each element: {"assumptionId":"<exact id from input>","status":"confirmed"|"need_more"|"not_supported"|"not_testable"|"disproven","evidence":"<required: 1-2 sentences explaining the status>"}.`;

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
      `User insights (SURVEY DATA — primary evidence for attitudinal assumptions; takes priority over comment data when present): ${context.userInsightsSummary}`,
      context.dataSourcesSummary ? `Data sources:\n${context.dataSourcesSummary}` : '',
      context.thematicCounts
        ? `THEMATIC COUNTS (pre-computed multi-word phrase matches from ALL comments — rough estimates based on keyword proximity, NOT semantic analysis; may include false positives from unrelated contexts; treat as order-of-magnitude guidance only, NOT as hard facts):\n${
            assumptions.map(a => `  Assumption ${a.assumptionId}: ~${context.thematicCounts![a.assumptionId] ?? 0} comments match its core phrases`).join('\n')
          }\nIMPORTANT: If the comment sample shows fewer clearly relevant comments than the thematic count suggests, trust the sample — the count may contain false matches from generic vocabulary.`
        : '',
      `Comments (filtered by relevance to assumptions, up to 25 per source — see THEMATIC COUNTS above for full-corpus numbers):\n${context.commentsSummary}`,
      context.commentPatternSummary ? `Comment patterns: ${context.commentPatternSummary}` : '',
      `Early signals: ${context.earlySignalsSummary}`,
      context.academicPapersSummary ? `Academic research:\n${context.academicPapersSummary}` : '',
    ].filter(Boolean).join('\n');

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${OUTPUT_SCHEMA}\n\n---\n${userContent}`;

    try {
      // max_tokens scales with number of assumptions: ~300 tokens per assumption for evidence + status
      // Keep conservative to avoid API timeouts
      const maxTokens = Math.max(3500, assumptions.length * 250); // Balanced: quality + stability
      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: fullPrompt,
          model: ANALYSIS_MODEL,
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
      const statusSet = new Set<AssumptionStatus>(['confirmed', 'need_more', 'not_supported', 'not_testable', 'disproven']);
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
