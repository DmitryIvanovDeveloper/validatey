import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';
import type { ResearchDataRepositoryPort } from '../../../research/application/ports/research-data-repository.port';
import type { CommentRepositoryPort } from '../ports/comment-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { CommentError } from '../../domain/errors/comment.error';

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface GetPatternCommentsRequest {
  projectId: string;
  patternType: string;
  patternIndex?: number;
  commentIdsFromQuery?: string[];
}

export interface GetPatternCommentsResponse {
  comments: CommentEntity[];
  pattern: { type: string; label: string; count: number; percentage: number };
}

/** Port for controller/DI: only execute is required; allows mocks in tests. */
export interface IGetPatternCommentsUseCase {
  execute(request: GetPatternCommentsRequest): Promise<ResultEx<GetPatternCommentsResponse, CommentError | Error>>;
}

function sortPatternsByCountAndCommentIds<T extends { count?: number; commentIds?: unknown }>(patterns: T[]): T[] {
  return [...patterns].sort((a, b) => {
    const countDiff = (b.count ?? 0) - (a.count ?? 0);
    if (countDiff !== 0) return countDiff;
    const aLen = Array.isArray(a.commentIds) ? a.commentIds.length : 0;
    const bLen = Array.isArray(b.commentIds) ? b.commentIds.length : 0;
    return bLen - aLen;
  });
}

function normalizeCommentIds(fromQuery: string[] | undefined, patternCommentIds: unknown[]): string[] {
  if (fromQuery && fromQuery.length > 0) {
    return [...new Set(fromQuery.filter((s) => UUID_LIKE.test(String(s).trim())))];
  }
  const flattenIds = (arr: unknown[]): unknown[] =>
    arr.flatMap((x) => (Array.isArray(x) ? flattenIds(x) : [x]));
  const toIdString = (id: unknown): string => {
    if (id == null) return '';
    if (typeof id === 'string') return id;
    if (typeof id === 'object' && id !== null && typeof (id as { id?: string }).id === 'string') return (id as { id: string }).id;
    return String(id);
  };
  const uuidFromString = (s: string): string | null => {
    const trimmed = String(s).trim();
    if (UUID_LIKE.test(trimmed)) return trimmed;
    const match = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    return match ? match[0]! : null;
  };
  const rawIds = flattenIds(patternCommentIds).map(toIdString).filter((s) => s.length > 0);
  const ids = new Set<string>();
  for (const s of rawIds) {
    const one = uuidFromString(s);
    if (one) ids.add(one);
    else {
      const all = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
      if (all) all.forEach((id) => ids.add(id));
    }
  }
  return [...ids].filter((id) => UUID_LIKE.test(id));
}

@injectable()
export class GetPatternCommentsUseCase implements IGetPatternCommentsUseCase {
  constructor(
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(request: GetPatternCommentsRequest): Promise<ResultEx<GetPatternCommentsResponse, CommentError | Error>> {
    const { projectId, patternType, patternIndex = -1, commentIdsFromQuery } = request;

    const researchResult = await this._researchDataRepository.findByProjectId(projectId);
    if (!researchResult.isSuccess) {
      return ResultEx.failure(new CommentError(researchResult.error.message));
    }

    const stored = researchResult.data;
    if (!stored?.commentPatternAnalysis?.patterns?.length) {
      return ResultEx.failure(new CommentError('Pattern analysis not available. Please run "Start Research" first.'));
    }

    const rawPatterns = [...stored.commentPatternAnalysis.patterns];
    const patterns = sortPatternsByCountAndCommentIds(rawPatterns);

    const pattern =
      patternIndex >= 0 && patternIndex < patterns.length
        ? patterns[patternIndex]
        : patterns.find((p) => p.type === patternType);

    if (!pattern) {
      return ResultEx.failure(new CommentError(`Pattern '${patternType}' not found in analysis`));
    }

    const patternCommentIds = Array.isArray(pattern.commentIds) ? pattern.commentIds : [];
    const commentIds = normalizeCommentIds(commentIdsFromQuery, patternCommentIds);

    if (commentIds.length === 0) {
      return ResultEx.success({
        comments: [],
        pattern: {
          type: pattern.type,
          label: pattern.label,
          count: pattern.count ?? 0,
          percentage: pattern.percentage ?? 0,
        },
      });
    }

    const commentsResult = await this._commentRepository.findByProjectIdAndIds(projectId, commentIds);
    if (!commentsResult.isSuccess) {
      return ResultEx.failure(commentsResult.error);
    }

    return ResultEx.success({
      comments: commentsResult.data,
      pattern: {
        type: pattern.type,
        label: pattern.label,
        count: pattern.count ?? 0,
        percentage: pattern.percentage ?? 0,
      },
    });
  }
}
