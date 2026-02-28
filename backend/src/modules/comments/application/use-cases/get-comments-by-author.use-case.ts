import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';
import type { ResearchDataRepositoryPort } from '../../../research/application/ports/research-data-repository.port';
import type { CommentRepositoryPort } from '../ports/comment-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';

export interface GetCommentsByAuthorRequest {
  projectId: string;
  author: string;
  sourceType?: 'reddit' | 'hackernews';
  supportingOnly?: boolean;
  limit?: number;
}

export interface CommentByAuthorItem {
  id: string;
  sourceId: string;
  projectId: string;
  externalId: string;
  content: string;
  author: string | null;
  url: string;
  contextTitle: string | null;
  contextUrl: string | null;
  createdAt: string;
  fetchedAt: string;
  processedAt: string | null;
  sourceType: 'reddit' | 'hackernews';
}

export interface GetCommentsByAuthorResponse {
  comments: CommentByAuthorItem[];
}

export interface IGetCommentsByAuthorUseCase {
  execute(request: GetCommentsByAuthorRequest): Promise<ResultEx<GetCommentsByAuthorResponse, CommentError | Error>>;
}

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

@injectable()
export class GetCommentsByAuthorUseCase implements IGetCommentsByAuthorUseCase {
  constructor(
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(request: GetCommentsByAuthorRequest): Promise<ResultEx<GetCommentsByAuthorResponse, CommentError | Error>> {
    const { projectId, author, sourceType: requestedSourceType, supportingOnly = false, limit = DEFAULT_LIMIT } = request;

    const trimmedAuthor = author?.trim();
    if (!trimmedAuthor) {
      return ResultEx.success({ comments: [] });
    }

    const effectiveLimit = Math.min(MAX_LIMIT, Math.max(1, limit));

    let supportingIds: Set<string> | null = null;
    if (supportingOnly) {
      const researchResult = await this._researchDataRepository.findByProjectId(projectId);
      if (!researchResult.isSuccess) {
        return ResultEx.failure(new CommentError(researchResult.error.message));
      }
      const patterns = researchResult.data?.commentPatternAnalysis?.patterns ?? [];
      supportingIds = new Set<string>();
      for (const p of patterns) {
        if (p.supportsHypothesis === true && Array.isArray(p.commentIds)) {
          for (const id of p.commentIds) {
            if (typeof id === 'string' && id.trim()) supportingIds.add(id.trim());
          }
        }
      }
    }

    const commentsResult = await this._commentRepository.findByProjectId(projectId, {
      author: trimmedAuthor,
      limit: supportingOnly ? 5000 : effectiveLimit,
      orderByCreatedAt: true,
    });
    if (!commentsResult.isSuccess) {
      return ResultEx.failure(commentsResult.error);
    }

    let comments = commentsResult.data;
    if (supportingOnly && supportingIds!.size > 0) {
      comments = comments.filter((c) => supportingIds!.has(c.id));
    }
    if (supportingOnly) {
      comments = comments.slice(0, effectiveLimit);
    }

    const sourcesResult = await this._commentRepository.getCommentSourcesByProjectId(projectId);
    const sourceTypesMap = new Map<string, 'reddit' | 'hackernews'>();
    if (sourcesResult.isSuccess) {
      sourcesResult.data.forEach((s) => sourceTypesMap.set(s.id, s.sourceType));
    }

    const items: CommentByAuthorItem[] = [];
    for (const comment of comments) {
      let sourceType: 'reddit' | 'hackernews' = sourceTypesMap.get(comment.sourceId) ?? 'reddit';
      const url = (comment.contextUrl || comment.url || '').toLowerCase();
      if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) {
        sourceType = 'hackernews';
      }
      if (requestedSourceType != null && sourceType !== requestedSourceType) continue;

      const data = comment.toData();
      items.push({
        id: data.id,
        sourceId: data.sourceId,
        projectId: data.projectId,
        externalId: data.externalId,
        content: data.content,
        author: data.author,
        url: data.url,
        contextTitle: data.contextTitle,
        contextUrl: data.contextUrl,
        createdAt: data.createdAt.toISOString(),
        fetchedAt: data.fetchedAt.toISOString(),
        processedAt: data.processedAt?.toISOString() ?? null,
        sourceType,
      });
    }

    return ResultEx.success({ comments: items });
  }
}
