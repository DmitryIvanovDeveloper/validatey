import { Request, Response } from 'express';
import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import type { StartFetchCommandHandler } from '../../application/commands/start-fetch.command-handler';
import type { StartFetchCommand } from '../../application/commands/start-fetch.command';
import type { GetCommentsQueryHandler } from '../../application/queries/get-comments.query-handler';
import type { GetCommentByIdQueryHandler } from '../../application/queries/get-comment-by-id.query-handler';
import type { GetFetchStatusQueryHandler } from '../../application/queries/get-fetch-status.query-handler';
import type { DeleteSourceCommandHandler } from '../../application/commands/delete-source.command-handler';
import type { DeleteSourceCommand } from '../../application/commands/delete-source.command';
import type { CommentSourceRepositoryPort } from '../../application/ports/comment-source-repository.port';
import type { CommentRepositoryPort } from '../../application/ports/comment-repository.port';
import type { FetchCommentsUseCase } from '../../application/use-cases/fetch-comments.usecase';
import { CommentSourceValueObject } from '../../domain/value-objects/comment-source.vo';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { ResearchDataRepositoryPort } from '../../../research/application/ports/research-data-repository.port';
import type { IGetPatternCommentsUseCase } from '../../application/use-cases/get-pattern-comments.use-case';
import type { IGetSuggestedOutreachCommentersUseCase } from '../../application/use-cases/get-suggested-outreach-commenters.use-case';
import type { IGetCommentsByAuthorUseCase } from '../../application/use-cases/get-comments-by-author.use-case';
import type { GetCommentsActivityUseCase } from '../../application/use-cases/get-comments-activity.usecase';
import type { GetCommentsFreshnessUseCase } from '../../application/use-cases/get-comments-freshness.usecase';

@injectable()
export class CommentController {
  constructor(
    @inject(COMMENT_TYPES.StartFetchCommandHandler)
    private readonly _startFetchCommandHandler: StartFetchCommandHandler,
    @inject(COMMENT_TYPES.DeleteSourceCommandHandler)
    private readonly _deleteSourceCommandHandler: DeleteSourceCommandHandler,
    @inject(COMMENT_TYPES.GetCommentsQueryHandler)
    private readonly _getCommentsQueryHandler: GetCommentsQueryHandler,
    @inject(COMMENT_TYPES.GetCommentByIdQueryHandler)
    private readonly _getCommentByIdQueryHandler: GetCommentByIdQueryHandler,
    @inject(COMMENT_TYPES.GetFetchStatusQueryHandler)
    private readonly _getFetchStatusQueryHandler: GetFetchStatusQueryHandler,
    @inject(COMMENT_TYPES.CommentSourceRepository)
    private readonly _sourceRepository: CommentSourceRepositoryPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort,
    @inject(COMMENT_TYPES.FetchCommentsUseCase)
    private readonly _fetchCommentsUseCase: FetchCommentsUseCase,
    @inject(COMMENT_TYPES.GetPatternCommentsUseCase)
    private readonly _getPatternCommentsUseCase: IGetPatternCommentsUseCase,
    @inject(COMMENT_TYPES.GetSuggestedOutreachCommentersUseCase)
    private readonly _getSuggestedOutreachCommentersUseCase: IGetSuggestedOutreachCommentersUseCase,
    @inject(COMMENT_TYPES.GetCommentsByAuthorUseCase)
    private readonly _getCommentsByAuthorUseCase: IGetCommentsByAuthorUseCase,
    @inject(COMMENT_TYPES.GetCommentsActivityUseCase)
    private readonly _getCommentsActivityUseCase: GetCommentsActivityUseCase,
    @inject(COMMENT_TYPES.GetCommentsFreshnessUseCase)
    private readonly _getCommentsFreshnessUseCase: GetCommentsFreshnessUseCase,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort
  ) {}

  /**
   * Resolves projectId (which can be UUID or slug) to UUID via ProjectRepository.
   */
  private async resolveProjectId(projectIdOrSlug: string): Promise<string | null> {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(projectIdOrSlug)) {
      const result = await this._projectRepository.findById(projectIdOrSlug);
      return result.isSuccess ? projectIdOrSlug : null;
    }
    const result = await this._projectRepository.findByPublicSlug(projectIdOrSlug);
    return result.isSuccess ? result.data.id : null;
  }

  public   async fetchComments(req: Request, res: Response): Promise<void> {
    try {
      console.log(`[CommentController.fetchComments] Starting fetch request`);
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      console.log(`[CommentController.fetchComments] Resolved projectId: ${projectId}`);
      const redditUrls = req.body?.redditUrls as string[] | undefined;
      const hnUrls = req.body?.hnUrls as string[] | undefined;
      const hnFeedType = req.body?.hnFeedType as 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
      const periodDays = req.body?.periodDays ? parseInt(String(req.body.periodDays), 10) : undefined;
      
      console.log(`[CommentController.fetchComments] Request body:`, {
        redditUrls: redditUrls?.length || 0,
        hnUrls: hnUrls?.length || 0,
        hnFeedType,
        periodDays
      });

      // Validate arrays if provided
      if (redditUrls && !Array.isArray(redditUrls)) {
        res.status(400).json({ error: 'redditUrls must be an array' });
        return;
      }

      if (hnUrls && !Array.isArray(hnUrls)) {
        res.status(400).json({ error: 'hnUrls must be an array' });
        return;
      }

      // Check if at least one source has data
      const hasRedditData = redditUrls && redditUrls.length > 0;
      const hasHnData = (hnUrls && hnUrls.length > 0) || hnFeedType;

      if (!hasRedditData && !hasHnData) {
        // No URLs provided — fetch all existing sources for this project
        console.log(`[CommentController.fetchComments] No URLs provided, fetching all existing project sources`);
        const command = { projectId, periodDays: Number.isFinite(periodDays) && periodDays! > 0 ? periodDays : undefined };
        const result = await this._startFetchCommandHandler.execute(command);
        if (!result.isSuccess) {
          res.status(500).json({ error: result.error.message });
          return;
        }
        res.status(202).json({ status: 'started' });
        return;
      }

      // Process Reddit URLs if provided
      if (hasRedditData) {
        console.log(`[CommentController.fetchComments] Processing Reddit URLs:`, redditUrls);
        const redditCommand: StartFetchCommand = {
          projectId,
          sourceType: 'reddit',
          redditUrls: redditUrls!.filter(url => url && url.trim()), // Filter out empty strings
          hnFeedType: undefined,
          hnUrls: undefined,
          periodDays: Number.isFinite(periodDays) && periodDays! > 0 ? periodDays : undefined,
        };

        console.log(`[CommentController.fetchComments] Executing Reddit fetch command`);
        const redditResult = await this._startFetchCommandHandler.execute(redditCommand);
        console.log(`[CommentController.fetchComments] Reddit fetch result:`, {
          success: redditResult.isSuccess,
          error: redditResult.isSuccess ? null : redditResult.error.message
        });
        if (!redditResult.isSuccess) {
          res.status(500).json({ error: `Reddit fetch failed: ${redditResult.error.message}` });
          return;
        }
      }

      // Process Hacker News data if provided
      if (hasHnData) {
        const hnCommand: StartFetchCommand = {
          projectId,
          sourceType: 'hackernews',
          redditUrls: undefined,
          hnFeedType: hnFeedType,
          hnUrls: hnUrls?.filter(url => url && url.trim()), // Filter out empty strings
          periodDays: Number.isFinite(periodDays) && periodDays! > 0 ? periodDays : undefined,
        };

        const hnResult = await this._startFetchCommandHandler.execute(hnCommand);
        if (!hnResult.isSuccess) {
          res.status(500).json({ error: `Hacker News fetch failed: ${hnResult.error.message}` });
          return;
        }
      }

      console.log(`[CommentController.fetchComments] Fetch started successfully, returning 202`);
      res.status(202).json({ status: 'started' });
    } catch (error) {
      console.error(`[CommentController.fetchComments] Error:`, error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getFetchStatus(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._getFetchStatusQueryHandler.execute();

      if (!result.isSuccess) {
        res.status(500).json({ error: result.error.message });
        return;
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json(result.data);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  // Test endpoint for direct fetch without job system
  public async testFetch(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      const hnUrl = req.query.hnUrl as string;

      if (!projectIdOrSlug || !hnUrl) {
        res.status(400).json({ error: 'projectId and hnUrl required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      console.log(`[Test Fetch] Testing HN URL: ${hnUrl}`);

      // Create source
      const sourceValueObject = CommentSourceValueObject.createHackerNews(hnUrl);
      const createResult = await this._sourceRepository.create({
        projectId,
        sourceType: 'hackernews',
        hnUrl,
        hnItemId: sourceValueObject.hnItemId,
      });

      if (!createResult.isSuccess) {
        res.status(500).json({ error: 'Failed to create source' });
        return;
      }

      const sourceId = createResult.data.id;
      console.log(`[Test Fetch] Created source ${sourceId}`);

      // Direct fetch
      const fetchResult = await this._fetchCommentsUseCase.execute({
        sourceId,
        projectId,
        sourceType: 'hackernews',
      });

      if (!fetchResult.isSuccess) {
        res.status(500).json({ error: fetchResult.error.message });
        return;
      }

      res.json({
        success: true,
        commentsCount: fetchResult.data.commentsCount,
        sourceId
      });
    } catch (error) {
      console.log('[Test Fetch] Error:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getComments(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      const sourceId = req.query.sourceId as string | undefined;
      const url = req.query.url as string | undefined;
      const isProcessed = req.query.isProcessed === 'true' ? true : req.query.isProcessed === 'false' ? false : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const periodMonths = req.query.periodMonths ? parseInt(String(req.query.periodMonths), 10) : undefined;
      const fromDate = req.query.fromDate && typeof req.query.fromDate === 'string' ? new Date(req.query.fromDate) : undefined;
      const toDate = req.query.toDate && typeof req.query.toDate === 'string' ? new Date(req.query.toDate) : undefined;

      const result = await this._getCommentsQueryHandler.execute({
        projectId,
        sourceId,
        url,
        isProcessed,
        limit,
        ...(periodMonths != null && Number.isFinite(periodMonths) && { periodMonths }),
        ...(fromDate && !isNaN(fromDate.getTime()) && { fromDate }),
        ...(toDate && !isNaN(toDate.getTime()) && { toDate }),
      });

      if (!result.isSuccess) {
        res.status(400).json({ error: result.error.message });
        return;
      }

      res.json({
        comments: result.data.comments,
        totalCount: result.data.totalCount || result.data.comments.length,
        hasMore: result.data.hasMore || false,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getCommentsActivity(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }
      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }
      const bucket = (req.query.bucket as 'week' | 'month') || 'month';
      const maxBuckets = req.query.maxBuckets ? parseInt(String(req.query.maxBuckets), 10) : 12;
      const result = await this._getCommentsActivityUseCase.execute({
        projectId,
        bucket,
        maxBuckets: Number.isFinite(maxBuckets) ? maxBuckets : 12,
      });
      if (!result.isSuccess) {
        res.status(400).json({ error: result.error.message });
        return;
      }
      res.json({ buckets: result.data.buckets });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getCommentsFreshness(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }
      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }
      const result = await this._getCommentsFreshnessUseCase.execute({ projectId });
      if (!result.isSuccess) {
        res.status(400).json({ error: result.error.message });
        return;
      }
      if (result.data === null) {
        res.json(null);
        return;
      }
      res.json({
        oldestCommentAt: result.data.oldestCommentAt.toISOString(),
        newestCommentAt: result.data.newestCommentAt.toISOString(),
        totalCount: result.data.totalCount,
        isStale: result.data.isStale,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getCommentById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id) {
        res.status(400).json({ error: 'Comment ID is required' });
        return;
      }

      const query = { id };
      const result = await this._getCommentByIdQueryHandler.execute(query);

      if (!result.isSuccess) {
        res.status(404).json({ error: result.error.message });
        return;
      }

      res.json(result.data.comment);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async deleteSource(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      const sourceId = req.params.sourceId;
      if (!sourceId) {
        res.status(400).json({ error: 'Source ID is required' });
        return;
      }

      const command: DeleteSourceCommand = {
        projectId,
        sourceId,
      };

      const result = await this._deleteSourceCommandHandler.execute(command);

      if (!result.isSuccess) {
        res.status(400).json({ error: result.error.message });
        return;
      }

      res.status(204).send(); // No Content
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async createSource(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      const { sourceType, redditUrl, hnUrl, hnFeedType, linkedinUrl } = req.body;

      if (!sourceType || !['reddit', 'hackernews', 'linkedin'].includes(sourceType)) {
        res.status(400).json({ error: 'Valid sourceType (reddit, hackernews, or linkedin) is required' });
        return;
      }

      // Validate required fields based on source type
      if (sourceType === 'reddit' && !redditUrl) {
        res.status(400).json({ error: 'redditUrl is required for reddit sources' });
        return;
      }

      if (sourceType === 'hackernews' && !hnUrl && !hnFeedType) {
        res.status(400).json({ error: 'hnUrl or hnFeedType is required for hackernews sources' });
        return;
      }

      if (sourceType === 'linkedin' && !linkedinUrl) {
        res.status(400).json({ error: 'linkedinUrl is required for linkedin sources' });
        return;
      }

      // Create value object to parse URL and extract additional fields
      let sourceValueObject;
      try {
        if (sourceType === 'reddit') {
          console.log(`[CommentController.createSource] Creating Reddit source from URL: ${redditUrl}`);
          sourceValueObject = CommentSourceValueObject.createReddit(redditUrl);
          console.log(`[CommentController.createSource] Extracted: postId=${sourceValueObject.postId}, subredditName=${sourceValueObject.subredditName}`);
        } else if (sourceType === 'hackernews') {
          if (hnUrl) {
            sourceValueObject = CommentSourceValueObject.createHackerNews(hnUrl);
          } else {
            sourceValueObject = CommentSourceValueObject.createHackerNews(hnFeedType);
          }
        } else {
          sourceValueObject = CommentSourceValueObject.createLinkedIn(linkedinUrl);
        }
      } catch (error) {
        res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid URL format' });
        return;
      }

      // Create source in repository
      const createInput = {
        projectId,
        sourceType,
        redditUrl: sourceType === 'reddit' ? redditUrl : undefined,
        subredditName: sourceType === 'reddit' ? sourceValueObject.subredditName : undefined,
        postId: sourceType === 'reddit' ? sourceValueObject.postId : undefined,
        hnFeedType: sourceType === 'hackernews' ? hnFeedType : undefined,
        hnUrl: sourceType === 'hackernews' ? hnUrl : undefined,
        hnItemId: sourceType === 'hackernews' ? sourceValueObject.hnItemId : undefined,
        linkedinUrl: sourceType === 'linkedin' ? linkedinUrl : undefined,
        linkedinPostId: sourceType === 'linkedin' ? sourceValueObject.linkedinPostId : undefined,
      };
      
      console.log(`[CommentController.createSource] Creating source with input:`, JSON.stringify(createInput, null, 2));
      console.log(`[CommentController.createSource] SourceValueObject details:`, {
        postId: sourceValueObject.postId,
        subredditName: sourceValueObject.subredditName,
        type: sourceValueObject.type
      });
      
      const createResult = await this._sourceRepository.create(createInput);
      
      console.log(`[CommentController.createSource] Create result:`, {
        success: createResult.isSuccess,
        postId: createResult.isSuccess ? createResult.data.postId : 'N/A',
        subredditName: createResult.isSuccess ? createResult.data.subredditName : 'N/A'
      });
      
      // Immediately verify by fetching back from DB
      if (createResult.isSuccess) {
        console.log(`[CommentController.createSource] Verifying source in DB...`);
        const verifyResult = await this._sourceRepository.findById(createResult.data.id);
        if (verifyResult.isSuccess) {
          console.log(`[CommentController.createSource] Verification result:`, {
            postId: verifyResult.data.postId,
            subredditName: verifyResult.data.subredditName,
            'matches create result': verifyResult.data.postId === createResult.data.postId && verifyResult.data.subredditName === createResult.data.subredditName
          });
        } else {
          console.error(`[CommentController.createSource] Verification failed:`, verifyResult.error);
        }
      }

      if (!createResult.isSuccess) {
        res.status(400).json({ error: createResult.error.message });
        return;
      }

      res.status(201).json({
        source: {
          id: createResult.data.id,
          sourceType: createResult.data.sourceType,
          redditUrl: createResult.data.redditUrl,
          hnUrl: createResult.data.hnUrl,
          subredditName: createResult.data.subredditName,
          postId: createResult.data.postId,
          hnFeedType: createResult.data.hnFeedType,
          hnItemId: createResult.data.hnItemId,
          createdAt: createResult.data.createdAt,
        }
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }


  public async analyzePatterns(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      const researchResult = await this._researchDataRepository.findByProjectId(projectId);
      if (!researchResult.isSuccess) {
        res.status(500).json({ error: researchResult.error.message });
        return;
      }

      const stored = researchResult.data;
      const analysis = stored?.commentPatternAnalysis;
      if (!analysis?.patterns?.length) {
        res.status(404).json({ error: 'Pattern analysis not available. Please run "Start Research" first.' });
        return;
      }

      const patterns = [...analysis.patterns].sort((a: any, b: any) => {
        const countDiff = (b.count ?? 0) - (a.count ?? 0);
        if (countDiff !== 0) return countDiff;
        const aLen = Array.isArray(a.commentIds) ? a.commentIds.length : 0;
        const bLen = Array.isArray(b.commentIds) ? b.commentIds.length : 0;
        return bLen - aLen;
      });
      res.setHeader('Cache-Control', 'no-store');
      res.json({ ...analysis, patterns });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getPatternComments(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      const patternType = req.params.patternType;

      if (!projectIdOrSlug || !patternType) {
        res.status(400).json({ error: 'Project ID and pattern type are required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      const rawIndex = req.query.patternIndex;
      const patternIndex = typeof rawIndex === 'string' && /^\d+$/.test(rawIndex) ? parseInt(rawIndex, 10) : -1;
      const queryIdsRaw = req.query.commentIds;
      const commentIdsFromQuery =
        typeof queryIdsRaw === 'string' && queryIdsRaw.length > 0
          ? [...new Set(queryIdsRaw.split(',').map((s) => s.trim()).filter(Boolean))]
          : undefined;

      const result = await this._getPatternCommentsUseCase.execute({
        projectId,
        patternType,
        patternIndex,
        commentIdsFromQuery,
      });

      if (!result.isSuccess) {
        const msg = result.error.message;
        if (msg.includes('not found') || msg.includes('not available')) {
          res.status(404).json({ error: msg });
        } else {
          res.status(500).json({ error: msg });
        }
        return;
      }

      const { comments, pattern } = result.data;

      const uniqueSourceIds = [...new Set(comments.map((c) => c.sourceId))];
      const sourcesResult = await this._commentRepository.getCommentSourcesByProjectId(projectId);
      const sourceTypesMap = new Map<string, string>();
      if (sourcesResult.isSuccess) {
        sourcesResult.data.forEach((source) => {
          if (uniqueSourceIds.includes(source.id)) {
            sourceTypesMap.set(source.id, source.sourceType);
          }
        });
      }

      const formattedComments = comments.map((comment) => {
        const data = comment.toData();
        let sourceType = sourceTypesMap.get(comment.sourceId) || 'unknown';
        if (sourceType === 'unknown') {
          const url = (data.contextUrl || data.url || '').toLowerCase();
          sourceType = url.includes('ycombinator.com') || url.includes('news.ycombinator.com') ? 'hackernews' : 'reddit';
        }
        return {
          ...data,
          createdAt: data.createdAt.toISOString(),
          fetchedAt: data.fetchedAt.toISOString(),
          processedAt: data.processedAt?.toISOString() ?? null,
          sourceType,
        };
      });

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        comments: formattedComments,
        total: formattedComments.length,
        pattern,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getSuggestedOutreach(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      const rawLimit = req.query.limit;
      const limit =
        typeof rawLimit === 'string' && /^\d+$/.test(rawLimit)
          ? Math.min(100, Math.max(1, parseInt(rawLimit, 10)))
          : 20;

      const result = await this._getSuggestedOutreachCommentersUseCase.execute({
        projectId,
        limit,
      });

      if (!result.isSuccess) {
        res.status(500).json({ error: result.error.message });
        return;
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json(result.data);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getCommentsByAuthor(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      const author = typeof req.query.author === 'string' ? req.query.author.trim() : '';
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }
      if (!author) {
        res.status(400).json({ error: 'Query parameter "author" is required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      const sourceType = req.query.sourceType === 'hackernews' ? 'hackernews' : req.query.sourceType === 'reddit' ? 'reddit' : undefined;
      const supportingOnly = req.query.supportingOnly === 'true' || req.query.supportingOnly === '1';
      const rawLimit = req.query.limit;
      const limit =
        typeof rawLimit === 'string' && /^\d+$/.test(rawLimit)
          ? Math.min(200, Math.max(1, parseInt(rawLimit, 10)))
          : 50;

      const result = await this._getCommentsByAuthorUseCase.execute({
        projectId,
        author,
        sourceType,
        supportingOnly,
        limit,
      });

      if (!result.isSuccess) {
        res.status(500).json({ error: result.error.message });
        return;
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json(result.data);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }

  public async getSources(req: Request, res: Response): Promise<void> {
    try {
      const projectIdOrSlug = req.params.projectId;
      if (!projectIdOrSlug) {
        res.status(400).json({ error: 'Project ID is required' });
        return;
      }

      const projectId = await this.resolveProjectId(projectIdOrSlug);
      if (!projectId) {
        res.status(404).json({ error: `Project not found: ${projectIdOrSlug}` });
        return;
      }

      // Get sources from repository
      const sourcesResult = await this._sourceRepository.findByProjectId(projectId);
      if (!sourcesResult.isSuccess) {
        res.status(400).json({ error: sourcesResult.error.message });
        return;
      }

      const sources = sourcesResult.data.map(source => ({
        id: source.id,
        sourceType: source.sourceType,
        redditUrl: source.redditUrl,
        hnUrl: source.hnUrl,
        subredditName: source.subredditName,
        postId: source.postId,
        hnFeedType: source.hnFeedType,
        hnItemId: source.hnItemId,
        createdAt: source.createdAt,
      }));

      res.json({ sources });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
}