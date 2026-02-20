import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { CommentRepositoryPort } from '../ports/comment-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';
import type { GetCommentsRequest, GetCommentsResponse, CommentItem } from '../input-output/get-comments.io';

@injectable()
export class GetCommentsUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort
  ) {}

  async execute(request: GetCommentsRequest): Promise<ResultEx<GetCommentsResponse, CommentError>> {
    try {
      let comments: CommentItem[] = [];
      let totalCount = 0;

      // Get comments by source ID if specified (takes precedence over projectId)
      if (request.sourceId) {
        const result = await this._commentRepository.findBySourceId(request.sourceId, {
          limit: request.limit,
          offset: request.offset,
        });

        if (!result.isSuccess) {
          return ResultEx.failure(result.error);
        }

        // Get source type for this specific sourceId
        let sourceType: 'reddit' | 'hackernews' = 'reddit'; // Default to reddit
        if (result.data.length > 0) {
          // Try to get projectId from the first comment (all comments from same source should have same projectId)
          const projectId = result.data[0].projectId;
          if (projectId) {
            const sourcesResult = await this._commentRepository.getCommentSourcesByProjectId(projectId);
            if (sourcesResult.isSuccess) {
              const source = sourcesResult.data.find(s => s.id === request.sourceId);
              if (source) {
                sourceType = source.sourceType;
              } else {
                // If source not found in database, determine from URL pattern
                const firstComment = result.data[0];
                const url = (firstComment.contextUrl || firstComment.url).toLowerCase();
                if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) {
                  sourceType = 'hackernews';
                }
                // Default is already 'reddit'
              }
            }
          }
        }

        // Add sourceType to each comment
        comments = result.data.map(comment => ({
          ...comment.toData(),
          sourceType
        }));
        totalCount = comments.length;

        // If we have a limit and got exactly that many, there might be more
        const hasMore = request.limit ? comments.length === request.limit : false;
        if (hasMore) {
          const countResult = await this._commentRepository.countBySourceId(request.sourceId);
          if (countResult.isSuccess) {
            totalCount = countResult.data;
          }
        }
      }

      // Get comments by project ID if specified (when sourceId is not specified)
      else if (request.projectId) {
        const result = await this._commentRepository.findByProjectId(request.projectId, {
          limit: request.limit,
          offset: request.offset,
        });

        if (!result.isSuccess) {
          return ResultEx.failure(result.error);
        }

        // Get source types for all unique sourceIds
        const uniqueSourceIds = [...new Set(result.data.map(comment => comment.sourceId))];
        const sourceTypesMap = new Map<string, 'reddit' | 'hackernews'>();

        if (uniqueSourceIds.length > 0) {
          const sourcesResult = await this._commentRepository.getCommentSourcesByProjectId(request.projectId);
          if (sourcesResult.isSuccess) {
            sourcesResult.data.forEach(source => {
              if (uniqueSourceIds.includes(source.id)) {
                sourceTypesMap.set(source.id, source.sourceType);
              }
            });
          }
        }

        // Add sourceType to each comment
        comments = result.data.map(comment => {
          let sourceType: 'reddit' | 'hackernews' | 'unknown' = sourceTypesMap.get(comment.sourceId) || 'unknown';

          // Fallback: determine sourceType from URL pattern if not found in database
          if (sourceType === 'unknown') {
            const url = (comment.contextUrl || comment.url).toLowerCase();
            if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) {
              sourceType = 'hackernews';
            } else {
              sourceType = 'reddit';
            }
          }

          return {
            ...comment.toData(),
            sourceType
          };
        });
        totalCount = comments.length;

        // If we have a limit and got exactly that many, there might be more
        const hasMore = request.limit ? comments.length === request.limit : false;
        if (hasMore) {
          const countResult = await this._commentRepository.countByProjectId(request.projectId);
          if (countResult.isSuccess) {
            totalCount = countResult.data;
          }
        }
      }

      // Filter by processed status if specified
      if (request.isProcessed !== undefined) {
        comments = comments.filter(comment => comment.isProcessed === request.isProcessed);
      }

      // Filter by URL if specified
      if (request.url) {
        // More flexible URL matching - check if URLs are related
        comments = comments.filter(comment => {
          const commentUrl = comment.url.toLowerCase();
          const requestUrl = request.url!.toLowerCase();

          // Exact match
          if (commentUrl === requestUrl) return true;

          // Comment URL contains request URL (e.g., comment from post contains subreddit URL)
          if (commentUrl.includes(requestUrl)) return true;

          // Request URL contains comment URL (less likely but possible)
          if (requestUrl.includes(commentUrl)) return true;

          // For Reddit: check if both are from same subreddit
          if (requestUrl.includes('reddit.com') && commentUrl.includes('reddit.com')) {
            const requestMatch = requestUrl.match(/reddit\.com\/r\/([^\/]+)/);
            const commentMatch = commentUrl.match(/reddit\.com\/r\/([^\/]+)/);
            if (requestMatch && commentMatch && requestMatch[1] === commentMatch[1]) {
              return true;
            }
          }

          // For Hacker News: check if both are from same item
          if (requestUrl.includes('ycombinator.com') && commentUrl.includes('ycombinator.com')) {
            const requestMatch = requestUrl.match(/\/item\?id=(\d+)/);
            const commentMatch = commentUrl.match(/\/item\?id=(\d+)/);
            if (requestMatch && commentMatch && requestMatch[1] === commentMatch[1]) {
              return true;
            }
          }

          return false;
        });

        totalCount = comments.length; // Update total count after URL filtering
      }

      return ResultEx.success({
        comments,
        totalCount,
        hasMore: request.limit ? (request.offset || 0) + comments.length < totalCount : false,
      });
    } catch (error) {
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }
}