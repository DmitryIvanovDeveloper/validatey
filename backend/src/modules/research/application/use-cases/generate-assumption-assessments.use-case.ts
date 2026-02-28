import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as SIGNALS_TYPES } from '../../../signals/infrastructure/bootstrap/types';
import { TYPES as RESPONSES_TYPES } from '../../../responses/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import { COMMENT_TYPES } from '../../../comments/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { EarlySignalsRepositoryPort } from '../../../signals/application/ports/early-signals-repository.port';
import type { ResponseRepositoryPort } from '../../../responses/application/ports/response-repository.port';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import type { AssumptionAssessmentLlmPort } from '../ports/assumption-assessment-llm.port';
import type { CommentRepositoryPort } from '../../../comments/application/ports/comment-repository.port';
import type { AssumptionAssessment, AssumptionStatus } from '../../domain/value-objects/assumption-assessment.vo';
import { CommentEntity } from '../../../comments/domain/entities/comment.entity';
import type { CommentPatternAnalysis } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';
import type { AcademicPapersBlock } from '../../domain/value-objects/academic-papers-block.vo';
import type { Response } from '../../../responses/domain/entities/response.entity';

export interface GenerateAssumptionAssessmentsRequest {
  projectId: string;
}

interface CommentBatch {
  id: string;
  comments: CommentEntity[];
  source: string;
  size: number;
}

interface BatchAnalysisResult {
  batchId: number;
  assessments: AssumptionAssessment[];
  commentCount: number;
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
    @inject(RESPONSES_TYPES.ResponseRepository)
    private readonly _responseRepository: ResponseRepositoryPort,
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

      // Run when synthesis exists (summary or verdict) so AI can output per-assumption verdicts
      const hasSynthesis = stored?.synthesisReport && (
        (typeof stored.synthesisReport.summary === 'string' && stored.synthesisReport.summary.trim().length > 0) ||
        (typeof stored.synthesisReport.verdict === 'string' && stored.synthesisReport.verdict.trim().length > 0)
      );
      if (!hasSynthesis) {
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

      // Load fresh survey responses for real-time user insights
      const responsesResult = await this._responseRepository.findByProjectId(projectId);
      const responses = responsesResult.isSuccess ? responsesResult.data : [];
      const userInsightsSummary = this.summarizeUserInsights(responses);

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

      // Check if we should use comment batching for deeper analysis
      const useCommentBatching = process.env.USE_COMMENT_BATCHING === 'true' && comments.length > 50;

      // Truncate hypothesis to keep only the audience-relevant part (first 600 chars)
      const fullHypothesis = project.hypothesis?.description ?? project.name ?? '';
      const hypothesisSummary = fullHypothesis.slice(0, 600) + (fullHypothesis.length > 600 ? '...' : '');

      const academicPapersSummary = this.summarizeAcademicPapers(stored.academicPapers ?? null) || undefined;

      if (useCommentBatching) {
        this._logger.info('generate-assumption-assessments.using-batch-mode', {
          projectId,
          totalComments: comments.length,
          batchMode: true
        });
        const verdictStr = String(stored.synthesisReport.verdict ?? '');
        const synthesisSummary =
          (typeof stored.synthesisReport.summary === 'string' && stored.synthesisReport.summary.trim())
            ? stored.synthesisReport.summary
            : (verdictStr ? `Overall verdict: ${verdictStr}.` : 'No executive summary yet.');
        const baseContext = {
          projectId,
          synthesisSummary,
          verdict: verdictStr,
          hypothesisSummary,
          userInsightsSummary: enhancedUserInsightsSummary,
          commentPatternSummary,
          dataSourcesSummary,
          earlySignalsSummary,
          academicPapersSummary,
        };
        return this.executeBatchCommentAnalysis(assumptions, comments, thematicCounts, baseContext);
      }

      const verdictStr = String(stored.synthesisReport.verdict ?? '');
      const synthesisSummary =
        (typeof stored.synthesisReport.summary === 'string' && stored.synthesisReport.summary.trim())
          ? stored.synthesisReport.summary
          : (verdictStr ? `Overall verdict: ${verdictStr}.` : 'No executive summary yet.');
      const context = {
        synthesisSummary,
        verdict: verdictStr,
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
        .slice(0, 25); // Balanced: more context without exceeding limits

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

    // Score each comment by relevance (includes Reddit score/depth bonus)
    const scoredComments = comments.map(comment => ({
      comment,
      score: this.calculateCommentRelevanceScore(comment, assumptionKeywords)
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
   * Calculate relevance score for a comment based on keyword matches and Reddit signals (upvotes, depth).
   */
  private calculateCommentRelevanceScore(comment: CommentEntity, keywords: string[]): number {
    const content = comment.content;
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

    // Reddit upvotes: high agreement signal (log scale to avoid dominance)
    if (comment.score != null && comment.score > 0) {
      score += Math.min(1.0, Math.log10(1 + comment.score) * 0.5);
    }
    // Reddit depth: deeper in thread = more engaged discussion
    if (comment.depth != null && comment.depth >= 2) {
      score += 0.2;
    }

    // Recency bonus (newer comments slightly preferred)
    const daysSincePost = (Date.now() - comment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
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

    const supportingPatterns = analysis.patterns.filter(p => p.supportsHypothesis === true);
    const contradictingPatterns = analysis.patterns.filter(p => p.supportsHypothesis === false);

    const parts: string[] = [];
    if (supportingPatterns.length > 0) {
      const top = supportingPatterns[0];
      const authorNote = typeof top.uniqueAuthorCount === 'number' ? ` (${top.uniqueAuthorCount} unique authors)` : '';
      parts.push(`Supporting evidence: ${top.insight}${authorNote}`);
    }
    if (contradictingPatterns.length > 0) {
      const top = contradictingPatterns[0];
      const authorNote = typeof top.uniqueAuthorCount === 'number' ? ` (${top.uniqueAuthorCount} unique authors)` : '';
      parts.push(`Contradicting or weakening: ${top.insight}${authorNote}`);
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

  /**
   * Execute batch analysis of all comments for deeper insights.
   * Splits comments into batches and analyzes each batch separately, then aggregates results.
   */
  private async executeBatchCommentAnalysis(
    assumptions: { id: string; text: string }[],
    comments: CommentEntity[],
    thematicCounts: Record<string, number>,
    baseContext: any
  ): Promise<ResultEx<AssumptionAssessment[] | null, Error>> {

    const COMMENT_BATCH_SIZE = 75; // Analyze 75 comments per batch
    const commentBatches = this.createCommentBatches(comments, COMMENT_BATCH_SIZE);

    this._logger.info('executeBatchCommentAnalysis.start', {
      projectId: baseContext?.projectId,
      totalComments: comments.length,
      batchSize: COMMENT_BATCH_SIZE,
      numBatches: commentBatches.length
    });

    const batchResults: BatchAnalysisResult[] = [];

    // Process each comment batch
    for (let i = 0; i < commentBatches.length; i++) {
      const batch = commentBatches[i];

      const batchContext = {
        ...baseContext,
        commentsSummary: this.formatBatchComments(batch.comments),
        currentBatchId: i,
        totalBatches: commentBatches.length,
        thematicCounts,
      };

      // Analyze assumptions with this specific batch of comments
      const batchResult = await this.analyzeBatchWithAssumptions(assumptions, batchContext);

      if (batchResult.isSuccess && batchResult.data) {
        batchResults.push({
          batchId: i,
          assessments: batchResult.data,
          commentCount: batch.comments.length
        });
      } else {
        this._logger.warn('batch-analysis-failed', {
          batchId: i,
          error: batchResult.error?.message
        });
      }
    }

    if (batchResults.length === 0) {
      this._logger.warn('all-batch-analyses-failed', { totalBatches: commentBatches.length });
      return ResultEx.success(null);
    }

    // Aggregate results from all batches
    const finalAssessments = this.aggregateBatchResults(batchResults, thematicCounts);

    this._logger.info('executeBatchCommentAnalysis.success', {
      projectId: baseContext?.projectId,
      batchesProcessed: batchResults.length,
      finalAssessments: finalAssessments.length
    });

    return ResultEx.success(finalAssessments);
  }

  /**
   * Create batches of comments for analysis.
   */
  private createCommentBatches(comments: CommentEntity[], batchSize: number): CommentBatch[] {
    const batches: CommentBatch[] = [];

    // Group comments by source first, then batch within sources
    const sourceGroups: Record<string, CommentEntity[]> = {};
    for (const comment of comments) {
      const source = comment.subsourceName || 'unknown';
      if (!sourceGroups[source]) sourceGroups[source] = [];
      sourceGroups[source].push(comment);
    }

    // Create batches, preferring to keep comments from same source together
    for (const [source, sourceComments] of Object.entries(sourceGroups)) {
      for (let i = 0; i < sourceComments.length; i += batchSize) {
        const batchComments = sourceComments.slice(i, i + batchSize);
        batches.push({
          id: `${source}_${Math.floor(i / batchSize)}`,
          comments: batchComments,
          source: source,
          size: batchComments.length
        });
      }
    }

    return batches;
  }

  /**
   * Format comments for a specific batch.
   */
  private formatBatchComments(comments: CommentEntity[]): string {
    const formatted = comments
      .slice(0, 100) // Limit to prevent token overflow
      .map(c => `"${c.content.substring(0, 150)}${c.content.length > 150 ? '...' : ''}"`)
      .join('\n  ');

    return `Batch comments (${comments.length} total):\n  ${formatted}`;
  }

  /**
   * Analyze assumptions with a specific batch of comments.
   */
  private async analyzeBatchWithAssumptions(
    assumptions: { id: string; text: string }[],
    context: any
  ): Promise<ResultEx<AssumptionAssessment[], Error>> {

    // Use standard batching for assumptions (existing logic)
    const BATCH_SIZE = 5;
    const allInputs = assumptions.map((a) => ({ assumptionId: a.id, text: a.text }));
    const batches: typeof allInputs[] = [];

    for (let i = 0; i < allInputs.length; i += BATCH_SIZE) {
      batches.push(allInputs.slice(i, i + BATCH_SIZE));
    }

    const allAssessments: AssumptionAssessment[] = [];

    for (const batch of batches) {
      const result = await this._assessmentLlm.generate(batch, context);
      if (result.isSuccess && result.data) {
        allAssessments.push(...result.data);
      } else {
        // Continue with other batches even if one fails
        this._logger.warn('assumption-batch-failed', { error: result.error?.message });
      }
    }

    return ResultEx.success(allAssessments);
  }

  /**
   * Aggregate results from multiple comment batches.
   */
  private aggregateBatchResults(
    batchResults: BatchAnalysisResult[],
    thematicCounts: Record<string, number>
  ): AssumptionAssessment[] {

    const aggregated: Record<string, {
      assumptionId: string;
      statuses: AssumptionStatus[];
      evidences: (string | null)[];
      confidence: number;
    }> = {};

    // Collect all results for each assumption
    for (const batchResult of batchResults) {
      for (const assessment of batchResult.assessments) {
        if (!aggregated[assessment.assumptionId]) {
          aggregated[assessment.assumptionId] = {
            assumptionId: assessment.assumptionId,
            statuses: [],
            evidences: [],
            confidence: 0
          };
        }

        aggregated[assessment.assumptionId].statuses.push(assessment.status);
        aggregated[assessment.assumptionId].evidences.push(assessment.evidence);
      }
    }

    // Create final assessments with aggregated evidence
    return Object.values(aggregated).map(agg => {
      const finalStatus = this.resolveAggregatedStatus(agg.statuses, thematicCounts[agg.assumptionId]);
      const aggregatedEvidence = this.aggregateEvidences(agg.evidences, thematicCounts[agg.assumptionId]);

      return {
        assumptionId: agg.assumptionId,
        status: finalStatus,
        evidence: aggregatedEvidence
      };
    });
  }

  /**
   * Resolve final status from multiple batch results.
   */
  private resolveAggregatedStatus(statuses: AssumptionStatus[], thematicCount: number): AssumptionStatus {
    const statusCounts = {
      confirmed: statuses.filter(s => s === 'confirmed').length,
      need_more: statuses.filter(s => s === 'need_more').length,
      not_supported: statuses.filter(s => s === 'not_supported').length
    };

    const totalBatches = statuses.length;

    // If majority of batches confirm and we have thematic evidence, confirm
    if (statusCounts.confirmed > totalBatches * 0.6 && thematicCount > 5) {
      return 'confirmed';
    }

    // If any batch shows contradiction, mark as not supported
    if (statusCounts.not_supported > 0) {
      return 'not_supported';
    }

    // Default to need_more for deeper analysis
    return 'need_more';
  }

  /**
   * Aggregate evidence from multiple batches.
   */
  private aggregateEvidences(evidences: (string | null)[], thematicCount: number): string | null {
    const validEvidences = evidences.filter(e => e != null);

    if (validEvidences.length === 0) return null;

    // Take the most detailed evidence, enhanced with batch info
    const bestEvidence = validEvidences.reduce((best, current) =>
      (current?.length || 0) > (best?.length || 0) ? current : best
    );

    return `Based on analysis of ${thematicCount} relevant comments across ${evidences.length} data batches: ${bestEvidence}`;
  }

  /**
   * Summarize user insights from survey responses.
   * Extracts key findings about user pain points, willingness to pay, and validation signals.
   */
  private summarizeUserInsights(responses: Response[]): string {
    if (!responses || responses.length === 0) {
      return 'No user insights available yet';
    }

    const surveyResponses: Array<{ theme: string; quote: string; value?: number }> = [];
    const numericAnswers: Array<{ theme: string; value: number; questionId: string }> = [];

    for (const response of responses) {
      for (const [questionId, answer] of Object.entries(response.answers || {})) {
        const questionLabel = response.questionLabels?.[questionId] || questionId;

        if (typeof answer === 'string' && answer.trim().length > 0) {
          surveyResponses.push({
            theme: questionLabel.toLowerCase(),
            quote: answer.trim()
          });

          // Try to extract numbers from text answers
          const numMatch = answer.match(/(\d+(\.\d+)?)/);
          if (numMatch) {
            const numValue = parseFloat(numMatch[1]);
            if (!isNaN(numValue) && numValue > 0) {
              numericAnswers.push({
                theme: questionLabel.toLowerCase(),
                value: numValue,
                questionId
              });
            }
          }
        } else if (typeof answer === 'number') {
          numericAnswers.push({
            theme: questionLabel.toLowerCase(),
            value: answer,
            questionId
          });
        }
      }
    }

    if (surveyResponses.length === 0 && numericAnswers.length === 0) {
      return 'Limited user insights available';
    }

    const parts: string[] = [];

    // Analyze numeric answers (severity scores, pricing, etc.)
    if (numericAnswers.length > 0) {
      const severityScores = numericAnswers.filter(n =>
        n.questionId === 'q_2' ||
        n.theme.includes('severity') || n.theme.includes('problem') ||
        n.theme.includes('pain') || n.theme.includes('annoying')
      );

      const pricingAnswers = numericAnswers.filter(n =>
        n.questionId === 'q_5' ||
        n.theme.includes('price') || n.theme.includes('pay') ||
        n.theme.includes('cost') || n.theme.includes('willing') ||
        n.value <= 300
      );

      if (severityScores.length > 0) {
        const values = severityScores.map(s => s.value);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        parts.push(`Problem severity: average ${average.toFixed(1)}/10 (range: ${min}-${max})`);
      }

      if (pricingAnswers.length > 0) {
        const values = pricingAnswers.map(p => p.value);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;

        parts.push(`Average willingness to pay: $${average.toFixed(0)}/month`);
      }
    }

    // Analyze text responses
    if (surveyResponses.length > 0) {
      const pricingInsights = surveyResponses.filter(r =>
        (r.theme?.includes('pay') ?? false) || (r.theme?.includes('price') ?? false) ||
        (r.theme?.includes('cost') ?? false) || r.quote.includes('$')
      );
      const painInsights = surveyResponses.filter(r =>
        (r.theme?.includes('annoying') ?? false) || (r.theme?.includes('problem') ?? false) ||
        (r.theme?.includes('pain') ?? false) || r.quote.includes('frustrat')
      );

      if (pricingInsights.length > 0) {
        const pricingQuotes = pricingInsights.slice(0, 2).map(r =>
          `"${r.quote.substring(0, 80)}${r.quote.length > 80 ? '...' : ''}"`
        );
        parts.push(`Pricing insights: ${pricingQuotes.join('; ')}`);
      }

      if (painInsights.length > 0) {
        const painQuotes = painInsights.slice(0, 2).map(r =>
          `"${r.quote.substring(0, 80)}${r.quote.length > 80 ? '...' : ''}"`
        );
        parts.push(`Pain points: ${painQuotes.join('; ')}`);
      }

      if (parts.length === 0 && surveyResponses.length > 0) {
        // Fallback: show general insights
        const generalQuotes = surveyResponses.slice(0, 2).map(r =>
          `"${r.quote.substring(0, 80)}${r.quote.length > 80 ? '...' : ''}"`
        );
        parts.push(`User responses: ${generalQuotes.join('; ')}`);
      }
    }

    return parts.length > 0 ? parts.join('. ') : `${responses.length} survey responses collected`;
  }
}
