import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';
import type { ResearchDataRepositoryPort } from '../../../research/application/ports/research-data-repository.port';
import type { CommentRepositoryPort } from '../ports/comment-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';

export interface SuggestedOutreachCommenter {
  author: string;
  sourceType: 'reddit' | 'hackernews';
  commentCount: number;
  supportingCount: number;
  lastCommentAt: string; // ISO
  profileUrl: string;
}

export interface GetSuggestedOutreachRequest {
  projectId: string;
  limit?: number;
}

export interface GetSuggestedOutreachResponse {
  commenters: SuggestedOutreachCommenter[];
}

export interface IGetSuggestedOutreachCommentersUseCase {
  execute(request: GetSuggestedOutreachRequest): Promise<ResultEx<GetSuggestedOutreachResponse, CommentError | Error>>;
}

const DEFAULT_LIMIT = 20;
const MAX_COMMENTS_LOAD = 5000;

function buildProfileUrl(author: string, sourceType: 'reddit' | 'hackernews'): string {
  if (!author || author.trim() === '') return '';
  const a = author.trim();
  if (sourceType === 'hackernews') {
    return `https://news.ycombinator.com/user?id=${encodeURIComponent(a)}`;
  }
  return `https://www.reddit.com/user/${encodeURIComponent(a)}`;
}

@injectable()
export class GetSuggestedOutreachCommentersUseCase implements IGetSuggestedOutreachCommentersUseCase {
  constructor(
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(request: GetSuggestedOutreachRequest): Promise<ResultEx<GetSuggestedOutreachResponse, CommentError | Error>> {
    const { projectId, limit = DEFAULT_LIMIT } = request;

    const researchResult = await this._researchDataRepository.findByProjectId(projectId);
    if (!researchResult.isSuccess) {
      return ResultEx.failure(new CommentError(researchResult.error.message));
    }

    const stored = researchResult.data;
    const patterns = stored?.commentPatternAnalysis?.patterns;
    if (!patterns?.length) {
      return ResultEx.success({ commenters: [] });
    }

    const supportingIds = new Set<string>();
    for (const p of patterns) {
      if (p.supportsHypothesis === true && Array.isArray(p.commentIds)) {
        for (const id of p.commentIds) {
          if (typeof id === 'string' && id.trim()) supportingIds.add(id.trim());
        }
      }
    }

    const commentsResult = await this._commentRepository.findByProjectId(projectId, {
      limit: MAX_COMMENTS_LOAD,
      orderByCreatedAt: true,
    });
    if (!commentsResult.isSuccess) {
      return ResultEx.failure(commentsResult.error);
    }

    const sourcesResult = await this._commentRepository.getCommentSourcesByProjectId(projectId);
    const sourceTypesMap = new Map<string, 'reddit' | 'hackernews'>();
    if (sourcesResult.isSuccess) {
      sourcesResult.data.forEach((s) => sourceTypesMap.set(s.id, s.sourceType));
    }

    type Key = string;
    const byAuthorSource = new Map<
      Key,
      { commentCount: number; supportingCount: number; lastCommentAt: Date }
    >();

    for (const comment of commentsResult.data) {
      const author = comment.author?.trim() ?? '';
      if (!author) continue;

      let sourceType: 'reddit' | 'hackernews' = sourceTypesMap.get(comment.sourceId) ?? 'reddit';
      const url = (comment.contextUrl || comment.url || '').toLowerCase();
      if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) {
        sourceType = 'hackernews';
      }

      const key: Key = `${author}\n${sourceType}`;
      const existing = byAuthorSource.get(key);
      const supporting = supportingIds.has(comment.id);
      const createdAt = comment.createdAt;

      if (existing) {
        existing.commentCount += 1;
        if (supporting) existing.supportingCount += 1;
        if (createdAt > existing.lastCommentAt) existing.lastCommentAt = createdAt;
      } else {
        byAuthorSource.set(key, {
          commentCount: 1,
          supportingCount: supporting ? 1 : 0,
          lastCommentAt: createdAt,
        });
      }
    }

    const commenters: SuggestedOutreachCommenter[] = [];
    for (const [key, stats] of byAuthorSource.entries()) {
      if (stats.supportingCount === 0) continue;
      const [author, sourceType] = key.split('\n') as [string, 'reddit' | 'hackernews'];
      commenters.push({
        author,
        sourceType,
        commentCount: stats.commentCount,
        supportingCount: stats.supportingCount,
        lastCommentAt: stats.lastCommentAt.toISOString(),
        profileUrl: buildProfileUrl(author, sourceType),
      });
    }

    commenters.sort((a, b) => {
      const supportDiff = b.supportingCount - a.supportingCount;
      if (supportDiff !== 0) return supportDiff;
      return new Date(b.lastCommentAt).getTime() - new Date(a.lastCommentAt).getTime();
    });

    const capped = commenters.slice(0, limit);
    return ResultEx.success({ commenters: capped });
  }
}
