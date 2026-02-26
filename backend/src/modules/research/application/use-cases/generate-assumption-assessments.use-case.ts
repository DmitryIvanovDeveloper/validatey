import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as SIGNALS_TYPES } from '../../../signals/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import { COMMENT_TYPES } from '../../../comments/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { EarlySignalsRepositoryPort } from '../../../signals/application/ports/early-signals-repository.port';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import type { AssumptionAssessmentLlmPort } from '../ports/assumption-assessment-llm.port';
import type { CommentRepositoryPort } from '../../../comments/application/ports/comment-repository.port';
import type { AssumptionAssessment } from '../../domain/value-objects/assumption-assessment.vo';
import { CommentEntity } from '../../../comments/domain/entities/comment.entity';
import type { CommentPatternAnalysis } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';
import type { AcademicPapersBlock } from '../../domain/value-objects/academic-papers-block.vo';

export interface GenerateAssumptionAssessmentsRequest {
  projectId: string;
}

@injectable()
export class GenerateAssumptionAssessmentsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(SIGNALS_TYPES.EarlySignalsRepository)
    private readonly _signalsRepository: EarlySignalsRepositoryPort,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort,
    @inject(RESEARCH_TYPES.AssumptionAssessmentLlm)
    private readonly _assessmentLlm: AssumptionAssessmentLlmPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(request: GenerateAssumptionAssessmentsRequest): Promise<ResultEx<AssumptionAssessment[] | null, Error>> {
    const { projectId } = request;
    this._logger.info('generate-assumption-assessments.start', { projectId });

    try {
      const projectResult = await this._projectRepository.findById(projectId);
      if (!projectResult.isSuccess) {
        return ResultEx.success(null);
      }
      const project = projectResult.data;

      const storedResult = await this._researchDataRepository.findByProjectId(projectId);
      const stored = storedResult.isSuccess ? storedResult.data : null;

      if (!stored?.synthesisReport?.summary) {
        this._logger.info('generate-assumption-assessments.skip-no-synthesis', { projectId });
        return ResultEx.success(null);
      }

      const assumptions = project.hypothesis?.assumptions ?? [];
      if (assumptions.length === 0) {
        return ResultEx.success(null);
      }

      const signalsResult = await this._signalsRepository.findByProjectId(projectId);
      const signals = signalsResult.isSuccess ? signalsResult.data : [];
      const earlySignalsSummary =
        signals.length > 0
          ? signals.map((s) => `[${s.type}] ${s.title}: ${s.description}`).join('. ')
          : 'No early signals yet';

      const userInsightsParts: string[] = [];
      if (stored?.userInsights?.topPains?.length) {
        userInsightsParts.push(`Pain points: ${stored.userInsights.topPains.join('; ')}`);
      }
      if (stored?.userInsights?.wtp) {
        userInsightsParts.push(`WTP: ${stored.userInsights.wtp}`);
      }
      const userInsightsSummary = userInsightsParts.length > 0 ? userInsightsParts.join('. ') : 'No user insights yet';

      // Load all comments for assessment (explicit limit so we never hit PostgREST default cap)
      const RESEARCH_COMMENTS_LIMIT = 10_000;
      const commentsResult = await this._commentRepository.findByProjectId(projectId, {
        limit: RESEARCH_COMMENTS_LIMIT,
      });
      const comments = commentsResult.isSuccess ? commentsResult.data : [];
      const commentsSummary = this.summarizeComments(comments, assumptions);

      // Get comment pattern analysis from stored research data (через порт)
      const commentPatternAnalysis = stored?.commentPatternAnalysis ?? null;
      const commentPatternSummary = this.summarizeCommentPatternAnalysis(commentPatternAnalysis);

      // Prioritize comments over "No user insights yet"
      let enhancedUserInsightsSummary = userInsightsSummary;
      if (userInsightsSummary === 'No user insights yet' && comments.length > 0) {
        enhancedUserInsightsSummary = `No survey responses yet, but ${comments.length} comments collected from online discussions. ${
          commentPatternSummary || 'Comments analyzed for patterns.'
        }`;
      }

      // Build factual data sources metadata from actual comment metadata
      const dataSourcesSummary = this.buildDataSourcesSummary(comments);

      // Pre-compute per-assumption thematic counts from full comment set
      const thematicCounts = this.buildThematicCounts(assumptions, comments);

      // Truncate hypothesis to keep only the audience-relevant part (first 600 chars)
      const fullHypothesis = project.hypothesis?.description ?? project.name ?? '';
      const hypothesisSummary = fullHypothesis.slice(0, 600) + (fullHypothesis.length > 600 ? '...' : '');

      const academicPapersSummary = this.summarizeAcademicPapers(stored.academicPapers ?? null) || undefined;

      const context = {
        synthesisSummary: stored.synthesisReport.summary,
        verdict: String(stored.synthesisReport.verdict ?? ''),
        hypothesisSummary,
        userInsightsSummary: enhancedUserInsightsSummary,
        commentsSummary,
        commentPatternSummary,
        dataSourcesSummary,
        earlySignalsSummary,
        academicPapersSummary,
        thematicCounts,
      };

      // Batch assumptions: max 5 per LLM call to avoid token limit and JSON truncation issues
      const BATCH_SIZE = 5;
      const allInputs = assumptions.map((a) => ({ assumptionId: a.id, text: a.text }));
      const batches: typeof allInputs[] = [];
      for (let i = 0; i < allInputs.length; i += BATCH_SIZE) {
        batches.push(allInputs.slice(i, i + BATCH_SIZE));
      }

      const allAssessments: import('../../domain/value-objects/assumption-assessment.vo').AssumptionAssessment[] = [];
      for (const batch of batches) {
        const batchResult = await this._assessmentLlm.generate(batch, context);
        if (!batchResult.isSuccess) {
          this._logger.warn('generate-assumption-assessments.llm-failed', { projectId, error: batchResult.error });
          return ResultEx.success(null);
        }
        allAssessments.push(...batchResult.data);
      }

      this._logger.info('generate-assumption-assessments.success', {
        projectId,
        count: allAssessments.length,
        batches: batches.length,
      });
      return ResultEx.success(allAssessments);
    } catch (error) {
      this._logger.error('generate-assumption-assessments.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Summarize comments for assumption assessment context.
   * Groups comments by source, filters by relevance to assumptions, and extracts key themes.
   */
  private summarizeComments(comments: CommentEntity[], assumptions: { text: string }[]): string {
    if (!comments || comments.length === 0) {
      return 'No comments collected yet';
    }

    // Group by source
    const sourceGroups: Record<string, CommentEntity[]> = {};
    for (const comment of comments) {
      const source = comment.subsourceName || 'other';
      if (!sourceGroups[source]) {
        sourceGroups[source] = [];
      }
      sourceGroups[source].push(comment);
    }

    const parts: string[] = [];
    for (const [source, sourceComments] of Object.entries(sourceGroups)) {
      // Filter and rank comments by relevance to assumptions
      const relevantComments = this.filterCommentsByRelevance(sourceComments, assumptions)
        .slice(0, 35); // Conservative limit to avoid API timeouts

      const commentSummaries = relevantComments.map(c =>
        `"${c.content.substring(0, 120)}${c.content.length > 120 ? '...' : ''}"`
      );

      parts.push(`${source} (${sourceComments.length} total, ${relevantComments.length} relevant):\n  ${commentSummaries.join('\n  ')}`);
    }

    return parts.length > 0 ? parts.join('\n\n') : 'Comments collected but no clear themes identified';
  }

  /**
   * Filter and rank comments by relevance to assumptions.
   * Prioritizes comments that contain keywords from assumption texts.
   */
  private filterCommentsByRelevance(
    comments: CommentEntity[],
    assumptions: { text: string }[]
  ): CommentEntity[] {

    // Extract all meaningful keywords from assumptions
    const assumptionKeywords = this.extractKeywordsFromAssumptions(assumptions);

    // Score each comment by relevance
    const scoredComments = comments.map(comment => ({
      comment,
      score: this.calculateCommentRelevanceScore(comment.content, assumptionKeywords)
    }));

    // Sort by relevance score (highest first), then by recency
    return scoredComments
      .sort((a, b) => {
        const scoreDiff = b.score - a.score;
        if (scoreDiff !== 0) return scoreDiff;
        // If scores are equal, prefer newer comments
        return b.comment.createdAt.getTime() - a.comment.createdAt.getTime();
      })
      .map(item => item.comment);
  }

  /**
   * Extract meaningful keywords from assumption texts.
   */
  private extractKeywordsFromAssumptions(assumptions: { text: string }[]): string[] {
    const keywords = new Set<string>();

    for (const assumption of assumptions) {
      // Extract words that are likely to be meaningful (4+ characters, not common stop words)
      const words = assumption.text.toLowerCase()
        .match(/\b[a-z]{4,}\b/g) || [];

      const stopWords = new Set([
        'that', 'with', 'will', 'have', 'this', 'from', 'they', 'when', 'what', 'where',
        'their', 'there', 'these', 'those', 'which', 'while', 'would', 'could', 'should',
        'about', 'after', 'again', 'against', 'because', 'before', 'being', 'between',
        'doing', 'during', 'other', 'under', 'until', 'using', 'within', 'without'
      ]);

      for (const word of words) {
        if (!stopWords.has(word)) {
          keywords.add(word);
        }
      }
    }

    return Array.from(keywords);
  }

  /**
   * Calculate relevance score for a comment based on keyword matches.
   */
  private calculateCommentRelevanceScore(content: string, keywords: string[]): number {
    const text = content.toLowerCase();
    let score = 0;

    // Base score from keyword matches
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        score += 1;
      }
    }

    // Bonus for comment quality indicators
    if (content.length > 200) score += 0.5; // Substantial comments
    if (content.includes('?') || content.includes('!')) score += 0.3; // Engagement indicators
    if (text.match(/\b(i|we|our|my)\b.*\b(experience|problem|solution|feedback)\b/i)) {
      score += 0.7; // Personal experience mentions
    }

    // Recency bonus (newer comments slightly preferred)
    const daysSincePost = (Date.now() - new Date().getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePost < 30) score += 0.2;

    return score;
  }

  /**
   * Pre-compute per-assumption comment counts using keyword matching.
   * Returns a map: assumptionId → number of comments that match the assumption's core keywords.
   * These are rough keyword-based counts, not semantic analysis, but they give LLM a factual
   * baseline instead of forcing it to estimate from a tiny sample.
   */
  private buildThematicCounts(
    assumptions: { id: string; text: string }[],
    comments: CommentEntity[]
  ): Record<string, number> {
    // Keyword sets per assumption — tuned to match meaningful signal, not broad noise.
    // Each set has core keywords that are likely to appear in on-topic comments.
    const ASSUMPTION_KEYWORDS: Record<string, string[][]> = {
      // a1: founders recognize lack of quality feedback
      a1: [
        ['need feedback', 'want feedback', 'looking for feedback', 'honest feedback'],
        ['quality feedback', 'valuable feedback', 'lack of feedback', 'hard to get feedback'],
        ['existing channels', 'friends don', 'nobody gives', 'struggle.*feedback'],
      ],
      // a2: willing to write feedback for others (give-to-get mechanic)
      a2: [
        ['give feedback', 'gave feedback', 'giving feedback', 'write feedback', 'provide feedback'],
        ['reciproc', 'in exchange', 'give.*get', 'pay it forward', 'mutual'],
        ['spend time.*review', 'review.*others', 'willing to help', 'happy to review'],
      ],
      // a3: quality of feedback given will be high
      a3: [
        ['superficial', 'shallow', 'generic comment', 'low quality', 'useless feedback'],
        ['quality of feedback', 'detailed feedback', 'actionable', 'in-depth', 'constructive'],
        ['bad feedback', 'not helpful', 'thoughtful review'],
      ],
      // a4: giver/taker balance
      a4: [
        ['free rider', 'freerider', 'freeload', 'takers', 'only take'],
        ['imbalance', 'unbalanced', 'abuse', 'game the system', 'exploit'],
        ['80.*20', '20.*80', 'cheating', 'unfair exchange'],
      ],
      // a5: retention / users return
      a5: [
        ['came back', 'coming back', 'return to', 'keep using', 'use it again'],
        ['retention', 'churn', 'sticky', 'habit', 'long.term use'],
        ['one-time', 'abandoned', 'never returned', 'still use'],
      ],
      // a6: fear of idea theft not a blocker
      a6: [
        ['steal.*idea', 'idea.*steal', 'copy.*idea', 'idea.*theft'],
        ['afraid to share', 'scared to share', 'fear of sharing', 'worry.*sharing'],
        ['nda', 'confidential', 'secret.*idea', 'sharing.*risk'],
      ],
    };

    const result: Record<string, number> = {};

    for (const assumption of assumptions) {
      const keywordGroups = ASSUMPTION_KEYWORDS[assumption.id];
      if (!keywordGroups) {
        // Unknown assumption id — do a broad text search using assumption text words
        const words = assumption.text.toLowerCase().match(/\b\w{5,}\b/g) ?? [];
        const topWords = words.slice(0, 5);
        const count = comments.filter(c => {
          const text = c.content.toLowerCase();
          return topWords.some(w => text.includes(w));
        }).length;
        result[assumption.id] = count;
        continue;
      }

      // Count comments matching at least one keyword from any group
      const count = comments.filter(c => {
        const text = c.content.toLowerCase();
        return keywordGroups.some(group =>
          group.some(kw => {
            // Support simple regex-like patterns with .*
            if (kw.includes('.*')) {
              const [a, b] = kw.split('.*');
              const idx = text.indexOf(a);
              if (idx === -1) return false;
              return text.indexOf(b, idx) !== -1;
            }
            return text.includes(kw);
          })
        );
      }).length;

      result[assumption.id] = count;
    }

    return result;
  }

  /**
   * Maps a source name to a pre-classified audience label.
   * Taxonomy is fixed (entrepreneurs, investors, potential users, other, unknown).
   * For hypotheses with different audiences (e.g. teachers, B2B buyers), sources
   * will fall into "other" or "unknown" — the LLM will still correctly report
   * "no data for [that audience]" and ask for the right research.
   */
  private classifySourceAudience(source: string): string {
    const s = source.toLowerCase();
    // Search across startup/founder communities — treat as entrepreneurs for AUDIENCE COVERAGE
    if ((s.includes('reddit') && s.includes('search')) || (s.includes('hacker') && s.includes('news'))) {
      return 'entrepreneurs';
    }
    // Entrepreneur/founder communities — label matches hypothesis term "entrepreneurs"
    if (s.includes('entrepreneur') || s.includes('startup') || s.includes('indiehacker') ||
        s.includes('indie_hacker') || s.includes('founderblock') || s.includes('imadethis') ||
        s.includes('sideproject') || s.includes('smallbusiness') || s.includes('bootstrapped') ||
        s.includes('yeswecode') || s.includes('buildinpublic') || s.includes('saas') ||
        s.includes('founder') || s.includes('indiebiz') || s.includes('microsaas') ||
        s.includes('micro_saas') || s.includes('solopreneur') || s.includes('productbuilder') ||
        s.includes('makersupport') || s.includes('nocode') || s.includes('no_code')) {
      return 'entrepreneurs';
    }
    // Investor communities — label matches hypothesis term "investors"
    if (s.includes('investor') || s.includes('venturecapital') || s.includes('angelist') ||
        s.includes('vc')) {
      return 'investors';
    }
    // Consumer/user communities — label matches hypothesis term "potential users"
    if (s.includes('productreview') || s.includes('appsumo') || s.includes('producthunt') ||
        s.includes('consumer')) {
      return 'potential users';
    }
    // Technical or marketing communities — NOT entrepreneurs, NOT investors, NOT users of products
    if (s.includes('seo') || s.includes('marketing') || s.includes('webdev') ||
        s.includes('programming') || s.includes('tech') || s.includes('learnprogramming')) {
      return 'other (tech/marketing professionals — not entrepreneurs or product users)';
    }
    return 'unknown';
  }

  /**
   * Build factual metadata about data sources from actual comment entities.
   * Includes a COVERAGE SUMMARY at the top — pre-aggregated per audience group —
   * so the LLM reads the answer directly instead of scanning per-source labels.
   */
  private buildDataSourcesSummary(comments: CommentEntity[]): string {
    if (!comments || comments.length === 0) {
      return 'No comments collected.';
    }

    const sourceMap = new Map<string, { count: number; titles: Set<string>; audience: string }>();
    for (const comment of comments) {
      const source = comment.subsourceName ?? '(unknown source)';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { count: 0, titles: new Set(), audience: this.classifySourceAudience(source) });
      }
      const entry = sourceMap.get(source)!;
      entry.count += 1;
      if (comment.contextTitle) {
        entry.titles.add(comment.contextTitle.slice(0, 80));
      }
    }

    // Build coverage summary per audience group — LLM reads this first
    const coverageMap = new Map<string, { sources: string[]; total: number }>();
    for (const [source, { count, audience }] of sourceMap.entries()) {
      if (!coverageMap.has(audience)) {
        coverageMap.set(audience, { sources: [], total: 0 });
      }
      const cov = coverageMap.get(audience)!;
      cov.sources.push(`${source} (${count})`);
      cov.total += count;
    }

    // Synonyms merged into the label itself (slash-separated) so the LLM can match by substring.
    // e.g. "founders" is literally present in "[audience: entrepreneurs / founders / indie hackers]"
    const AUDIENCE_LABEL_VARIANTS: Record<string, string> = {
      entrepreneurs: 'entrepreneurs / founders / indie hackers / solopreneurs / bootstrappers / startup founders / builders',
      investors: 'investors / VCs / angels / venture capitalists',
      'potential users': 'potential users / end users / customers / consumers / buyers',
    };

    const totalCount = comments.length;
    const coverageLines: string[] = [
      `Total comments in this analysis: ${totalCount}. When writing evidence, prefer to state how many of these are directly relevant to the assumption's topic (estimate from the Comments block), e.g. "Of ${totalCount} comments, ~N are about [topic]". Otherwise cite this total. Do not cite only a subset of sources (e.g. "6 from r/X, r/Y").`,
      '',
      'AUDIENCE COVERAGE (to match, find your ACTOR word anywhere in the [audience: ...] label):',
    ];
    for (const [audience, { sources, total }] of coverageMap.entries()) {
      const covered = audience !== 'unknown' && !audience.startsWith('other');
      const label = AUDIENCE_LABEL_VARIANTS[audience] ?? audience;
      coverageLines.push(
        `  ${covered ? '✓' : '–'} [audience: ${label}]: ${total} comments from ${sources.join(', ')}`
      );
    }
    coverageLines.push('');

    // Detailed source list
    const detailLines: string[] = ['DETAILED SOURCES:'];
    for (const [source, { count, titles, audience }] of sourceMap.entries()) {
      const topTitles = [...titles].slice(0, 3);
      const titlesStr = topTitles.length > 0 ? ` — topics: "${topTitles.join('"; "')}"` : '';
      detailLines.push(`  • ${source} [audience: ${audience}]: ${count} comments${titlesStr}`);
    }

    return [...coverageLines, ...detailLines].join('\n');
  }

  /**
   * Summarize comment pattern analysis for assumption assessment context.
   * Converts CommentPatternAnalysis into a concise text summary.
   */
  private summarizeCommentPatternAnalysis(
    analysis: CommentPatternAnalysis | null
  ): string | undefined {
    if (!analysis || analysis.patterns.length === 0) {
      return undefined; // Optional field
    }

    const validationPatterns = analysis.patterns.filter(p => p.type === 'validation');
    const failurePatterns = analysis.patterns.filter(p => p.type === 'failure');

    const parts: string[] = [];
    if (validationPatterns.length > 0) {
      const topValidation = validationPatterns[0];
      parts.push(`Validation signals: ${topValidation.insight}`);
    }
    if (failurePatterns.length > 0) {
      const topFailure = failurePatterns[0];
      parts.push(`Failure patterns: ${topFailure.insight}`);
    }

    if (analysis.validationScore >= 70) {
      parts.push(`Strong validation score: ${analysis.validationScore}/100`);
    }

    return parts.length > 0 ? parts.join('. ') : undefined;
  }

  private summarizeAcademicPapers(block: AcademicPapersBlock | null): string {
    if (!block || block.papers.length === 0) return '';
    const lines = block.papers.map(
      (p) => `"${p.title}" (${p.year ?? 'n/a'}, cited ${p.citationCount}x): ${p.abstractSnippet}`
    );
    return `Relevant academic research:\n${lines.join('\n')}`;
  }
}
