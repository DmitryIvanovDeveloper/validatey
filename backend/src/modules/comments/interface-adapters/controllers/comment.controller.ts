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
import type { FetchCommentsUseCase } from '../../application/use-cases/fetch-comments.usecase';
import type { AnalyzeCommentPatternsUseCase } from '../../application/use-cases/analyze-comment-patterns.use-case';
import { CommentSourceValueObject } from '../../domain/value-objects/comment-source.vo';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';

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
    @inject(COMMENT_TYPES.FetchCommentsUseCase)
    private readonly _fetchCommentsUseCase: FetchCommentsUseCase,
    @inject(COMMENT_TYPES.AnalyzeCommentPatternsUseCase)
    private readonly _analyzeCommentPatternsUseCase: AnalyzeCommentPatternsUseCase,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort
  ) {}

  /**
   * Resolves projectId (which can be UUID or slug) to UUID
   */
  private async resolveProjectId(projectIdOrSlug: string): Promise<string | null> {
    // Check if it's already a UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(projectIdOrSlug)) {
      return projectIdOrSlug;
    }

    // It's a slug, try to find project by slug
    // First try to find by public_slug
    const supabase = getSupabaseClient();
    const { data: projectBySlug, error: slugError } = await supabase
      .from('projects')
      .select('id')
      .eq('public_slug', projectIdOrSlug)
      .single();

    if (!slugError && projectBySlug) {
      return projectBySlug.id;
    }

    // If not found by public_slug, try to find by name (slug might be derived from name)
    // This is a fallback - ideally projects should have proper slugs
    const { data: projectByName, error: nameError } = await supabase
      .from('projects')
      .select('id')
      .ilike('name', projectIdOrSlug.replace(/-/g, ' '))
      .single();

    if (!nameError && projectByName) {
      return projectByName.id;
    }

    // If still not found, return null (project not found)
    return null;
  }

  public   async fetchComments(req: Request, res: Response): Promise<void> {
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

      const redditUrls = req.body?.redditUrls as string[] | undefined;
      const hnUrls = req.body?.hnUrls as string[] | undefined;
      const hnFeedType = req.body?.hnFeedType as 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
      const periodDays = req.body?.periodDays ? parseInt(String(req.body.periodDays), 10) : undefined;

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
        res.status(400).json({ error: 'At least one source must have URLs or feed type specified' });
        return;
      }

      // Process Reddit URLs if provided
      if (hasRedditData) {
        const redditCommand: StartFetchCommand = {
          projectId,
          sourceType: 'reddit',
          redditUrls: redditUrls!.filter(url => url && url.trim()), // Filter out empty strings
          hnFeedType: undefined,
          hnUrls: undefined,
          periodDays: Number.isFinite(periodDays) && periodDays! > 0 ? periodDays : undefined,
        };

        const redditResult = await this._startFetchCommandHandler.execute(redditCommand);
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

      res.status(202).json({ status: 'started' });
    } catch (error) {
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

      const result = await this._getCommentsQueryHandler.execute({
        projectId,
        sourceId,
        url,
        isProcessed,
        limit
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
      
      const createResult = await this._sourceRepository.create(createInput);

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

      const result = await this._analyzeCommentPatternsUseCase.execute(projectId);

      if (!result.isSuccess) {
        res.status(500).json({ error: result.error?.message ?? 'Pattern analysis failed' });
        return;
      }

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