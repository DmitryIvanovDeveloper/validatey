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

      // Get comments for assumption assessment
      const commentsResult = await this._commentRepository.findByProjectId(projectId);
      const comments = commentsResult.isSuccess ? commentsResult.data : [];
      const commentsSummary = this.summarizeComments(comments);

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

      // Truncate hypothesis to keep only the audience-relevant part (first 600 chars)
      const fullHypothesis = project.hypothesis?.description ?? project.name ?? '';
      const hypothesisSummary = fullHypothesis.slice(0, 600) + (fullHypothesis.length > 600 ? '...' : '');

      const llmResult = await this._assessmentLlm.generate(
        assumptions.map((a) => ({ assumptionId: a.id, text: a.text })),
        {
          synthesisSummary: stored.synthesisReport.summary,
          verdict: String(stored.synthesisReport.verdict ?? ''),
          hypothesisSummary,
          userInsightsSummary: enhancedUserInsightsSummary,
          commentsSummary,
          commentPatternSummary,
          dataSourcesSummary,
          earlySignalsSummary,
        }
      );

      if (!llmResult.isSuccess) {
        this._logger.warn('generate-assumption-assessments.llm-failed', { projectId, error: llmResult.error });
        return ResultEx.success(null);
      }

      this._logger.info('generate-assumption-assessments.success', {
        projectId,
        count: llmResult.data.length,
      });
      return ResultEx.success(llmResult.data);
    } catch (error) {
      this._logger.error('generate-assumption-assessments.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Summarize comments for assumption assessment context.
   * Groups comments by source and extracts key themes.
   */
  private summarizeComments(comments: CommentEntity[]): string {
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
      const recentComments = sourceComments
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3);

      const commentSummaries = recentComments.map(c =>
        `"${c.content.substring(0, 100)}${c.content.length > 100 ? '...' : ''}"`
      );

      parts.push(`${source}: ${commentSummaries.join('; ')}`);
    }

    return parts.length > 0 ? parts.join('. ') : 'Comments collected but no clear themes identified';
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

    const coverageLines: string[] = [
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
}
