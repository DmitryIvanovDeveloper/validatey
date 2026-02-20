import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import type { CommentRepositoryPort } from '../ports/comment-repository.port';
import type { CommentPatternAnalyzerPort } from '../ports/comment-pattern-analyzer.port';
import type { PatternRulesRepositoryPort } from '../ports/pattern-rules-repository.port';
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
    private readonly _patternRulesRepository: PatternRulesRepositoryPort
  ) {}

  async execute(projectId: string): Promise<ResultEx<CommentPatternAnalysis, Error>> {
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
