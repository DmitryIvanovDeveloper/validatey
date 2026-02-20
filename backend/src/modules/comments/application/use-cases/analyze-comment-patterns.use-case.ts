import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import type { CommentRepositoryPort } from '../ports/comment-repository.port';
import type { CommentPatternAnalyzerPort } from '../ports/comment-pattern-analyzer.port';
import type { CommentPatternAnalysis } from '../../domain/value-objects/comment-pattern-analysis.vo';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class AnalyzeCommentPatternsUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort,
    @inject(COMMENT_TYPES.CommentPatternAnalyzer)
    private readonly _analyzer: CommentPatternAnalyzerPort
  ) {}

  async execute(projectId: string): Promise<ResultEx<CommentPatternAnalysis, Error>> {
    const result = await this._commentRepository.findByProjectId(projectId, { limit: 500 });

    if (!result.isSuccess) {
      return ResultEx.failure(new Error(result.error?.message ?? 'Failed to load comments'));
    }

    const analysis = this._analyzer.analyze(result.data);
    return ResultEx.success(analysis);
  }
}
