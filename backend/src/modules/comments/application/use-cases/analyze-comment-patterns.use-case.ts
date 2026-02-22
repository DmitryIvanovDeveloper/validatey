import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';
import type { CommentRepositoryPort } from '../ports/comment-repository.port';
import type { CommentPatternAnalyzerPort } from '../ports/comment-pattern-analyzer.port';
import type { PatternRulesRepositoryPort } from '../ports/pattern-rules-repository.port';
import type { ResearchDataRepositoryPort } from '../../../research/application/ports/research-data-repository.port';
import type { CommentPatternAnalysis } from '../../domain/value-objects/comment-pattern-analysis.vo';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class AnalyzeCommentPatternsUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort,
    @inject(COMMENT_TYPES.CommentPatternAnalyzer)
    private readonly _analyzer: CommentPatternAnalyzerPort,
    @inject(COMMENT_TYPES.PatternRulesRepository)
    private readonly _patternRulesRepository: PatternRulesRepositoryPort,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort
  ) {}

  async execute(projectId: string): Promise<ResultEx<CommentPatternAnalysis, Error>> {
    // Check if we have cached analysis in research_data (from Start Research)
    const storedResult = await this._researchDataRepository.findByProjectId(projectId);
    if (storedResult.isSuccess && storedResult.data?.commentPatternAnalysis) {
      const stored = storedResult.data.commentPatternAnalysis;
      // Check if analysis is still fresh (less than 1 hour old)
      const analysisAge = Date.now() - new Date(stored.analyzedAt).getTime();
      const MAX_AGE = 60 * 60 * 1000; // 1 hour
      
      if (analysisAge < MAX_AGE) {
        // Return cached analysis
        return ResultEx.success(stored);
      }
    }

    // Perform new analysis
    const [commentsResult, rulesResult, weightsResult] = await Promise.all([
      this._commentRepository.findByProjectId(projectId, { limit: 500 }),
      this._patternRulesRepository.getActiveRules(),
      this._patternRulesRepository.getScoreWeights(),
    ]);

    if (!commentsResult.isSuccess) {
      return ResultEx.failure(new Error(commentsResult.error?.message ?? 'Failed to load comments'));
    }

    if (!rulesResult.isSuccess) {
      return ResultEx.failure(new Error(rulesResult.error?.message ?? 'Failed to load pattern rules'));
    }

    if (!weightsResult.isSuccess) {
      return ResultEx.failure(new Error(weightsResult.error?.message ?? 'Failed to load score weights'));
    }

    const analysis = this._analyzer.analyze(
      commentsResult.data,
      rulesResult.data,
      weightsResult.data
    );

    return ResultEx.success(analysis);
  }
}
