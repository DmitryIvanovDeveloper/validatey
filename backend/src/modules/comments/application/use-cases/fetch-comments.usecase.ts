import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { CommentFetcherPort, FetchCommentsInput } from '../ports/comment-fetcher.port';
import { CommentRepositoryPort } from '../ports/comment-repository.port';
import { CommentSourceRepositoryPort } from '../ports/comment-source-repository.port';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { CommentSourceValueObject } from '../../domain/value-objects/comment-source.vo';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentFetchError } from '../../domain/errors/comment.error';
import type { FetchCommentsUseCaseInput, FetchCommentsUseCaseOutput } from '../input-output/fetch-comments.io';

@injectable()
export class FetchCommentsUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentFetcher)
    private readonly _commentFetcher: CommentFetcherPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort,
    @inject(COMMENT_TYPES.CommentSourceRepository)
    private readonly _sourceRepository: CommentSourceRepositoryPort
  ) {}

  async execute(
    input: FetchCommentsUseCaseInput,
    onProgress?: (data: { commentsCountSoFar: number; currentSourceName: string | null }) => void
  ): Promise<ResultEx<FetchCommentsUseCaseOutput, CommentFetchError>> {
    try {
      console.log(`[FetchComments UseCase] Starting with input:`, input);
      // Create or get comment source
      const sourceResult = await this._ensureCommentSource(input);
      if (!sourceResult.isSuccess) {
        return ResultEx.failure(sourceResult.error);
      }
      const { id: sourceId, source } = sourceResult.data;

      // Prepare fetch input based on source type
      const fetchInput: FetchCommentsInput = this._prepareFetchInput(input, source);
      onProgress?.({ commentsCountSoFar: 0, currentSourceName: source.getDisplayName() });

      // Fetch comments from external source
      console.log(`[Fetch UseCase] Fetching comments for source ${sourceId}, type: ${input.sourceType}`);
      const fetchResult = await this._commentFetcher.fetch(fetchInput);
      if (!fetchResult.isSuccess) {
        console.log(`[Fetch UseCase] Fetch failed:`, fetchResult.error);
        return ResultEx.failure(fetchResult.error);
      }

      const { comments: rawComments, errors } = fetchResult.data;
      console.log(`[Fetch UseCase] Fetched ${rawComments.length} raw comments`);

      // Convert raw comments to entities
      console.log(`[Fetch UseCase] Converting ${rawComments.length} raw comments to entities`);
      const commentEntities = rawComments.map(rawComment => {
        console.log(`[Fetch UseCase] Processing comment: ${rawComment.externalId}`);
        return CommentEntity.create({
          sourceId: sourceId,
          projectId: input.projectId,
          externalId: rawComment.externalId,
          content: rawComment.content,
          author: rawComment.author,
          url: rawComment.url,
          contextTitle: rawComment.contextTitle,
          contextUrl: rawComment.contextUrl,
          createdAt: rawComment.createdAt,
          fetchedAt: new Date(),
          importOrigin: 'api_fetch',
          subsourceName: input.sourceType === 'reddit' ? source.subredditName || null : null,
        });
      });

      console.log(`[Fetch UseCase] Created ${commentEntities.length} comment entities`);

      if (commentEntities.length === 0) {
        console.log(`[Fetch UseCase] No entities to save, returning success`);
        return ResultEx.success({
          success: true,
          commentsCount: 0,
          sourcesProcessed: 1,
          commentsBySource: { [source.getDisplayName()]: 0 },
          errors: null,
          fetchedAt: new Date(),
        });
      }

      // Save comments to database
      console.log(`[Fetch UseCase] Calling bulkSave with ${commentEntities.length} entities`);
      const saveResult = await this._commentRepository.bulkSave(commentEntities);
      if (!saveResult.isSuccess) {
        console.log(`[Fetch UseCase] Save failed:`, saveResult.error);
        return ResultEx.failure(new CommentFetchError('Failed to save comments to database'));
      }

      console.log(`[Fetch UseCase] Successfully saved ${commentEntities.length} comments`);

      onProgress?.({
        commentsCountSoFar: commentEntities.length,
        currentSourceName: source.getDisplayName()
      });

      return ResultEx.success({
        success: true,
        commentsCount: commentEntities.length,
        sourcesProcessed: 1,
        commentsBySource: { [source.getDisplayName()]: commentEntities.length },
        errors: errors || null,
        fetchedAt: new Date(),
      });
    } catch (error) {
      return ResultEx.failure(new CommentFetchError(
        error instanceof Error ? error.message : 'Unknown fetch error'
      ));
    }
  }

  private async _ensureCommentSource(input: FetchCommentsUseCaseInput): Promise<ResultEx<{ id: string; source: CommentSourceValueObject }, CommentFetchError>> {
    // If sourceId is provided, get existing source
    if (input.sourceId) {
      console.log(`[EnsureCommentSource] Getting existing source by ID: ${input.sourceId}`);
      const sourceResult = await this._sourceRepository.findById(input.sourceId);
      if (!sourceResult.isSuccess) {
        console.log(`[EnsureCommentSource] Failed to find source ${input.sourceId}:`, sourceResult.error);
        return ResultEx.failure(new CommentFetchError(`Source not found: ${input.sourceId}`));
      }

      const dbSource = sourceResult.data;
      console.log(`[EnsureCommentSource] Found source:`, {
        id: dbSource.id,
        type: dbSource.sourceType,
        hnUrl: dbSource.hnUrl,
        hnItemId: dbSource.hnItemId
      });

      // Create value object from DB source
      let sourceValueObject: CommentSourceValueObject;
      if (dbSource.sourceType === 'reddit') {
        sourceValueObject = CommentSourceValueObject.createReddit(dbSource.redditUrl!);
        
        // If source in DB is missing postId/subredditName, update it
        if ((!dbSource.postId || !dbSource.subredditName) && sourceValueObject.postId && sourceValueObject.subredditName) {
          console.log(`[EnsureCommentSource] Updating source ${dbSource.id} with missing postId/subredditName`);
          const updateResult = await this._sourceRepository.update(dbSource.id, {
            postId: sourceValueObject.postId,
            subredditName: sourceValueObject.subredditName,
          });
          if (!updateResult.isSuccess) {
            console.warn(`[EnsureCommentSource] Failed to update source: ${updateResult.error.message}`);
          }
        }
      } else {
        console.log(`[EnsureCommentSource] Creating HN source value object from DB source`);
        if (dbSource.hnUrl) {
          console.log(`[EnsureCommentSource] Using hnUrl: ${dbSource.hnUrl}`);
          sourceValueObject = CommentSourceValueObject.createHackerNews(dbSource.hnUrl);
        } else if (dbSource.hnFeedType) {
          console.log(`[EnsureCommentSource] Using hnFeedType: ${dbSource.hnFeedType}`);
          sourceValueObject = CommentSourceValueObject.createHackerNews(dbSource.hnFeedType);
        } else {
          console.log(`[EnsureCommentSource] Invalid HN source configuration`);
          return ResultEx.failure(new CommentFetchError('Invalid HN source configuration'));
        }
      }

      console.log(`[EnsureCommentSource] Created source value object:`, {
        type: sourceValueObject.type,
        hnFeedType: sourceValueObject.hnFeedType,
        hnItemId: sourceValueObject.hnItemId,
        hnUrl: sourceValueObject.hnUrl
      });

      return ResultEx.success({ id: dbSource.id, source: sourceValueObject });
    }

    // For Reddit
    if (input.sourceType === 'reddit') {
      if (!input.redditUrls || input.redditUrls.length === 0) {
        return ResultEx.failure(new CommentFetchError('Reddit URL is required'));
      }

      const redditUrl = input.redditUrls[0]; // Use first URL for single source creation
      console.log(`[EnsureCommentSource] Creating source value object from URL: ${redditUrl}`);
      const sourceValueObject = CommentSourceValueObject.createReddit(redditUrl);
      console.log(`[EnsureCommentSource] Source value object created:`, {
        postId: sourceValueObject.postId,
        subredditName: sourceValueObject.subredditName,
        redditUrl: sourceValueObject.redditUrl
      });

      // Check if source already exists
      const existingSources = await this._sourceRepository.findByProjectId(input.projectId);
      if (!existingSources.isSuccess) {
        return ResultEx.failure(new CommentFetchError('Failed to check existing sources'));
      }

      const existingSource = existingSources.data.find(s =>
        s.redditUrl === redditUrl && s.sourceType === 'reddit'
      );

      if (existingSource) {
        return ResultEx.success({ id: existingSource.id, source: sourceValueObject });
      }

      // Create new source with extracted postId and subredditName
      console.log(`[EnsureCommentSource] Creating new Reddit source with postId=${sourceValueObject.postId}, subredditName=${sourceValueObject.subredditName}`);
      const createResult = await this._sourceRepository.create({
        projectId: input.projectId,
        sourceType: 'reddit',
        redditUrl: redditUrl,
        subredditName: sourceValueObject.subredditName,
        postId: sourceValueObject.postId,
      });

      return createResult.isSuccess
        ? ResultEx.success({ id: createResult.data.id, source: sourceValueObject })
        : ResultEx.failure(new CommentFetchError('Failed to create comment source'));
    }

    // For Hacker News
    if (input.sourceType === 'hackernews') {
      if (!input.hnFeedType) {
        return ResultEx.failure(new CommentFetchError('Hacker News feed type is required'));
      }

      const sourceValueObject = CommentSourceValueObject.createHackerNews(input.hnFeedType);

      // Check if source already exists
      const existingSources = await this._sourceRepository.findByProjectId(input.projectId);
      if (!existingSources.isSuccess) {
        return ResultEx.failure(new CommentFetchError('Failed to check existing sources'));
      }

      const existingSource = existingSources.data.find(s =>
        s.hnFeedType === input.hnFeedType && s.sourceType === 'hackernews'
      );

      if (existingSource) {
        return ResultEx.success({ id: existingSource.id, source: sourceValueObject });
      }

      // Create new source
      const createResult = await this._sourceRepository.create({
        projectId: input.projectId,
        sourceType: 'hackernews',
        hnFeedType: input.hnFeedType,
      });

      return createResult.isSuccess
        ? ResultEx.success({ id: createResult.data.id, source: sourceValueObject })
        : ResultEx.failure(new CommentFetchError('Failed to create comment source'));
    }

    return ResultEx.failure(new CommentFetchError('Unsupported source type'));
  }

  private _prepareFetchInput(input: FetchCommentsUseCaseInput, source: CommentSourceValueObject): FetchCommentsInput {
    console.log(`[PrepareFetchInput] Input:`, input);
    console.log(`[PrepareFetchInput] Source:`, {
      type: source.type,
      hnFeedType: source.hnFeedType,
      hnItemId: source.hnItemId,
      hnUrl: source.hnUrl
    });

    const baseInput = {
      sinceDate: input.periodDays ? new Date(Date.now() - input.periodDays * 24 * 60 * 60 * 1000) : undefined,
    };

    if (input.sourceType === 'reddit') {
      // If postId/subredditName are not in source, try to extract from URL
      let postId = source.postId;
      let subredditName = source.subredditName;
      
      if ((!postId || !subredditName) && source.redditUrl) {
        console.log(`[PrepareFetchInput] postId or subredditName missing, extracting from URL: ${source.redditUrl}`);
        try {
          const sourceFromUrl = CommentSourceValueObject.createReddit(source.redditUrl);
          postId = sourceFromUrl.postId || postId;
          subredditName = sourceFromUrl.subredditName || subredditName;
          console.log(`[PrepareFetchInput] Extracted from URL: postId=${postId}, subredditName=${subredditName}`);
        } catch (err) {
          console.warn(`[PrepareFetchInput] Failed to extract from URL:`, err);
        }
      }
      
      console.log(`[PrepareFetchInput] Final Reddit input: postId=${postId}, subredditName=${subredditName}`);
      
      return {
        ...baseInput,
        sourceType: 'reddit',
        subredditNames: subredditName ? [subredditName] : [],
        postId: postId || undefined,
        limitPerSubreddit: 100,
        apiCredentials: {
          clientId: process.env.REDDIT_CLIENT_ID,
          clientSecret: process.env.REDDIT_CLIENT_SECRET,
          userAgent: 'web:com.validatey.comments:v1.0.0 (by /u/validatey_bot)',
        },
      };
    } else {
      console.log(`[PrepareFetchInput] Preparing HN input with itemId: ${source.hnItemId}`);
      return {
        ...baseInput,
        sourceType: 'hackernews',
        feedType: source.hnFeedType,
        itemId: source.hnItemId,
        limitStories: 50,
      };
    }
  }
}