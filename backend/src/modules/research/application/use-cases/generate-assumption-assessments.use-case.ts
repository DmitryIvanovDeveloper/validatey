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
        enhancedUserInsightsSummary = `No survey responses yet, but ${comments.length} comments collected from social media. ${
          commentPatternSummary || 'Comments analyzed for patterns.'
        }`;
      }

      const llmResult = await this._assessmentLlm.generate(
        assumptions.map((a) => ({ assumptionId: a.id, text: a.text })),
        {
          synthesisSummary: stored.synthesisReport.summary,
          verdict: String(stored.synthesisReport.verdict ?? ''),
          userInsightsSummary: enhancedUserInsightsSummary, // Use enhanced summary
          commentsSummary,
          commentPatternSummary, // NEW: Pass pattern analysis summary
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
