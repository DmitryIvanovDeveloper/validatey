import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { UserStoriesLlmPort, UserStoriesInput, UserStory } from '../../application/ports/user-stories-llm.port';
import { UserStoriesGenerationError } from '../../application/ports/user-stories-llm.port';

const AI_PROXY_URL = process.env.SYNTHESIS_LLM_URL || 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You are a product manager. Your ONLY job is to turn the provided research Context into NEEDS-FOCUSED user stories that capture validated user needs and pain points — NOT product features or solutions.

NEEDS-FOCUSED (validation, not solution design):
- Each story describes a USER NEED or PAIN POINT evidenced in the research. Do NOT describe product features, UI, or "system provides X".
- goal: what the user NEEDS or struggles with (e.g. "Need to prioritize work effectively", "Need to understand climate risk impact"), NOT "Use a dashboard" or "Get risk assessment tool".
- benefit: why this need matters or what problem it addresses (e.g. "Reduce overload", "Make informed decisions"), NOT "Use the feature".
- acceptanceCriteria: how we know the need or pain is validated — e.g. "Need reflected in comment patterns", "Pain point confirmed in synthesis", or outcome-based conditions. Do NOT write "System provides X", "User can do Y in the app", or feature-level criteria.

STRICT RULE — NO INVENTED CONTENT:
- Use ONLY information that is explicitly stated or clearly implied in the Context below.
- Do NOT add any feature, integration, platform, or user need that is not mentioned in the Context.
- Do NOT add generic ideas (e.g. mobile app, wearables, onboarding, dashboards) unless they appear in the Context.
- Every story must be traceable to a specific sentence or pattern in the Context (hypothesis, synthesis, target audience, comment patterns, pain points).
- If the Context is sparse, output fewer stories. Prefer 5–8 grounded stories over 15 with invented ones.

STORY RULES:
- Roles: only from Target audience and roles implied by the hypothesis/patterns.
- Goals/benefits: only from Hypothesis, Synthesis summary, Comment patterns, and Top pain points. Prioritize stories that map to the listed pain points.
- Key assumptions: prefer stories for "confirmed" or "need_more" assumptions; avoid stories for "not_supported".
- Acceptance criteria: 2–4 short items that describe validation/evidence of the need (e.g. "Need for X is reflected in patterns", "Pain Y is evidenced in comments"). When Evidence quotes exist, align wording with them. No feature descriptions.
- functionalArea: short labels from context (e.g. core, validation, analytics) or "general".
- priority: high = hypothesis/core pain or top pain points; medium = synthesis/patterns; low = only if clearly suggested.

SOLUTION DIRECTION (optional per story):
- solutionDirection: one short phrase from Context (hypothesis/synthesis) suggesting how to address this need — e.g. "Support via task prioritization and focus". Omit if no clear direction in context. Do NOT invent features.

OUTPUT FORMAT:
- Return ONLY a valid JSON array. No markdown, no code blocks, no text before or after.
- Use COMPACT JSON (minimal whitespace) to avoid truncation.
- Each story: id, role, goal, benefit, priority, acceptanceCriteria (array of 2–4 strings), functionalArea, solutionDirection (optional string).
- Example: [{"id":"US-001","role":"...","goal":"...","benefit":"...","priority":"high","acceptanceCriteria":["c1","c2"],"functionalArea":"core","solutionDirection":"Support via prioritization"}]
`;

@injectable()
export class UserStoriesLlmAdapter implements UserStoriesLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) { }

  async generateUserStories(input: UserStoriesInput): Promise<ResultEx<UserStory[], UserStoriesGenerationError>> {
    try {
      this._logger.info('user-stories-llm.generate.start', { projectName: input.projectName });

      const context = this.buildPrompt(input);
      const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nContext:\n${context}`;

      const response = await this._httpClient.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt: fullPrompt,
          model: 'llama3.3-70b',
          max_tokens: 8192,
        },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );

      const raw = (response?.response ?? '').trim();
      if (!raw) {
        return ResultEx.failure(new UserStoriesGenerationError(
          'Empty response from LLM',
          'INVALID_RESPONSE',
          undefined
        ));
      }

      const content = this.normalizeContent(raw);
      const parsed = this.parseJsonArray(content);
      if (parsed === null) {
        return ResultEx.failure(new UserStoriesGenerationError(
          'Failed to parse LLM response as JSON array',
          'INVALID_RESPONSE',
          raw.substring(0, 1200)
        ));
      }

      const stories = this.mapToStories(parsed);
      this._logger.info('user-stories-llm.generate.success', {
        projectName: input.projectName,
        storiesCount: stories.length
      });
      return ResultEx.success(stories);
    } catch (error) {
      this._logger.error('user-stories-llm.generate.exception', {
        projectName: input.projectName,
        error: error instanceof Error ? error.message : String(error)
      });
      return ResultEx.failure(new UserStoriesGenerationError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR',
        undefined
      ));
    }
  }

  private buildPrompt(input: UserStoriesInput): string {
    const context = `
PROJECT: ${input.projectName}

HYPOTHESIS SUMMARY:
${input.hypothesisSummary}

MARKET ANALYSIS:
${input.marketSummary}

SYNTHESIS REPORT:
Verdict: ${input.synthesisReport.verdict}
Summary: ${input.synthesisReport.summary}
Recommendations: ${input.synthesisReport.recommendations.join(', ')}

TARGET AUDIENCE:
${input.targetAudience}

COMMENT ANALYSIS:
${input.commentMetrics ? `Total comments: ${input.commentMetrics.totalCount}, Sources: ${Object.entries(input.commentMetrics.bySource).map(([k, v]) => `${k}: ${v}`).join(', ')}` : 'No comment data available'}

${input.commentPatternAnalysis ? `
COMMENT PATTERNS (use only these — each pattern can become 1–2 stories max):
${input.commentPatternAnalysis.patterns.slice(0, 8).map((p, i) => `${i + 1}. [${p.type}] ${p.label}${p.insight ? `. ${p.insight}` : ''}`).join('\n')}
Validation Score: ${input.commentPatternAnalysis.validationScore}
` : ''}
${input.topPainPoints?.length ? `
TOP PAIN POINTS (prioritize stories that address these):
${input.topPainPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}
` : ''}
${input.keyAssumptions?.length ? `
KEY ASSUMPTIONS (prefer stories for confirmed/need_more; avoid stories for not_supported):
${input.keyAssumptions.map(a => `- ${a.text} [${a.status}]${a.evidence ? ` Evidence: ${a.evidence.slice(0, 120)}` : ''}`).join('\n')}
` : ''}
${input.patternExampleQuotes?.length ? `
EVIDENCE QUOTES (use this wording when writing acceptance criteria where relevant):
${input.patternExampleQuotes.map(q => `- "${q.patternLabel}": "${q.quote}"`).join('\n')}
` : ''}

CRITICAL: Generate NEEDS-FOCUSED user stories ONLY from the data above. Describe user needs and pain points (validation), NOT product features or solutions. Do not add "System provides", "User can", or feature-level acceptance criteria. Fewer stories that match the data are better than more with invented content.
`;

    return context;
  }

  /**
   * Normalize LLM output: strip markdown code blocks, extract array from first [ to last ], trim.
   */
  private normalizeContent(raw: string): string {
    let s = raw.trim();
    const codeBlock = /^```(?:json)?\s*([\s\S]*?)```\s*$/i.exec(s);
    if (codeBlock) s = codeBlock[1].trim();
    const firstBracket = s.indexOf('[');
    const lastBracket = s.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      s = s.substring(firstBracket, lastBracket + 1);
    }
    return s.trim();
  }

  /** Remove trailing comma before ] or } so JSON becomes parseable (LLM often adds trailing commas). */
  private fixTrailingComma(content: string): string {
    let s = content;
    // Fix trailing comma before closing bracket/brace (repeat to handle nested , }, ])
    for (let i = 0; i < 3; i++) {
      s = s.replace(/,(\s*)\]\s*$/, '$1]').replace(/,(\s*)\}\s*\]\s*$/, '$1}]');
    }
    return s;
  }

  /**
   * Parse content as JSON array with multiple fallbacks: direct parse, trailing comma fix, truncated array recovery.
   */
  private parseJsonArray(content: string): unknown[] | null {
    if (!content.trimStart().startsWith('[')) return null;

    const attempts: { name: string; str: string }[] = [
      { name: 'direct', str: content },
      { name: 'trailing-comma', str: this.fixTrailingComma(content) },
    ];
    for (const { name, str } of attempts) {
      try {
        const value = JSON.parse(str) as unknown;
        if (Array.isArray(value)) return value;
      } catch {
        // continue
      }
    }

    const truncatedAttempts = [content, this.fixTrailingComma(content)];
    for (const str of truncatedAttempts) {
      const closed = this.tryCloseTruncatedArray(str);
      if (closed !== null) {
        this._logger.warn('user-stories-llm.used-truncated-recovery', { itemCount: closed.length });
        return closed;
      }
    }
    return null;
  }

  /** If LLM response is truncated (no closing ]), try to close after last complete object. */
  private tryCloseTruncatedArray(content: string): unknown[] | null {
    const trimmed = content.trim();
    if (!trimmed.startsWith('[')) return null;

    const tryCloseAt = (endIndex: number): unknown[] | null => {
      if (endIndex < 0) return null;
      const candidate = trimmed.substring(0, endIndex) + ']';
      try {
        const v = JSON.parse(candidate) as unknown;
        return Array.isArray(v) ? v : null;
      } catch {
        return null;
      }
    };

    // Strategy 1: LLM may output pretty-printed "}\n ,\n {" — find last }\s*,
    const re = /\}\s*,/g;
    let lastBracketEnd = -1;
    let m: RegExpExecArray | null;
    while ((m = re.exec(trimmed)) !== null) lastBracketEnd = m.index + 1;
    let closed = lastBracketEnd >= 0 ? tryCloseAt(lastBracketEnd) : null;
    if (closed !== null) return closed;

    // Strategy 2: compact JSON "}," — lastIndexOf
    const lastComma = trimmed.lastIndexOf('},');
    if (lastComma !== -1) closed = tryCloseAt(lastComma + 1);
    if (closed !== null) return closed;

    // Strategy 3: single object truncated without comma: [ { "id": "1", ... }
    const noTrailing = trimmed.replace(/\s+$/, '');
    if (noTrailing.endsWith('}')) closed = tryCloseAt(noTrailing.length);
    return closed;
  }

  private mapToStories(parsed: unknown[]): UserStory[] {
    const objectItems = parsed.filter(
      (item): item is Record<string, unknown> => typeof item === 'object' && item !== null
    );
    if (objectItems.length < parsed.length) {
      this._logger.warn('user-stories-llm.non-object-items', {
        total: parsed.length,
        objects: objectItems.length,
        firstType: parsed[0] != null ? typeof parsed[0] : 'null',
        firstPreview: String(parsed[0]).substring(0, 80)
      });
    }
    return objectItems
      .map((item, index) => {
        const id = typeof item.id === 'string' && item.id.trim()
          ? item.id.trim()
          : this.generateStableId(item, index);
        const solutionDirection =
          typeof item.solutionDirection === 'string' && item.solutionDirection.trim()
            ? item.solutionDirection.trim()
            : undefined;
        return {
          id,
          role: String(item.role || 'user'),
          goal: String(item.goal || ''),
          benefit: String(item.benefit || ''),
          priority: this.validatePriority(item.priority),
          acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
            ? item.acceptanceCriteria.map(String)
            : [],
          functionalArea: String(item.functionalArea || 'general'),
          ...(solutionDirection ? { solutionDirection } : {})
        };
      })
      .filter(story => story.goal.trim().length > 0);
  }

  private generateStableId(story: Record<string, unknown>, index: number): string {
    // Create stable ID based on story content
    const content = `${story.role || ''}${story.goal || ''}${story.benefit || ''}`;
    const hash = require('crypto').createHash('md5').update(content).digest('hex');
    return `story_${hash.substring(0, 8)}_${index}`;
  }

  private validatePriority(priority: unknown): 'high' | 'medium' | 'low' {
    const validPriorities = ['high', 'medium', 'low'];
    const str = String(priority || '').toLowerCase();
    return validPriorities.includes(str) ? str as 'high' | 'medium' | 'low' : 'medium';
  }
}