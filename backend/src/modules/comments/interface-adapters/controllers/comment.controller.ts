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
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort,
    @inject(COMMENT_TYPES.FetchCommentsUseCase)
    private readonly _fetchCommentsUseCase: FetchCommentsUseCase,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort
  ) {}

  /**
   * Returns true if comment text is relevant to the pattern (label, insight, or examples).
   * Used to avoid showing comments that were wrongly assigned to a pattern by enrichment or LLM.
   */
  private static commentContentMatchesPattern(commentContent: string, pattern: any): boolean {
    if (!commentContent || !commentContent.trim()) return false;
    const norm = (s: string) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    const words = (s: string) => norm(s).split(/\s+/).filter((w) => w.length >= 4);
    const commentNorm = norm(commentContent);
    const commentWordSet = new Set(words(commentContent));
    const examples = pattern.examples ?? [];

    // 1) Match by example substring: comment contains (or is contained in) example snippet
    for (const ex of examples) {
      const exContent = typeof ex === 'object' && ex !== null && typeof ex.content === 'string' ? ex.content : '';
      const needle = norm(exContent).slice(0, 120);
      if (needle.length >= 10 && (commentNorm.includes(needle) || needle.includes(commentNorm.slice(0, 120)))) {
        return true;
      }
    }

    // 2) Match by significant words from pattern label + insight
    const labelWords = words(pattern.label ?? '');
    const insightWords = words(pattern.insight ?? '');
    const patternWords = [...new Set([...labelWords, ...insightWords])];
    if (patternWords.length >= 2) {
      const matchCount = patternWords.filter((w) => commentWordSet.has(w)).length;
      if (matchCount >= 2) return true;
    }

    // 3) Words from example contents
    const exampleWords = new Set<string>();
    for (const ex of examples) {
      const exContent = typeof ex === 'object' && ex !== null && typeof ex.content === 'string' ? ex.content : '';
      words(exContent).forEach((w) => exampleWords.add(w));
    }
    if (exampleWords.size >= 2) {
      const matchCount = [...exampleWords].filter((w) => commentWordSet.has(w)).length;
      if (matchCount >= 2) return true;
    }

    // 4) Not enough pattern text to validate — keep comment (e.g. short label, no examples)
    if (patternWords.length < 2 && exampleWords.size < 2) return true;
    return false;
  }

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

      // Get pattern analysis from stored research data (generated during synthesis)
      const researchDataResult = await this._projectRepository.findById(projectId);
      if (!researchDataResult.isSuccess) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Try to get analysis from research data first
      const researchData = await getSupabaseClient()
        .from('research_data')
        .select('comment_pattern_analysis')
        .eq('project_id', projectId)
        .maybeSingle();

      if (researchData.data?.comment_pattern_analysis) {
        const analysis = researchData.data.comment_pattern_analysis as { patterns?: any[]; [k: string]: any };
        const patterns = analysis.patterns ?? [];
        const sortedPatterns = [...patterns].sort((a: any, b: any) => {
          const countDiff = (b.count ?? 0) - (a.count ?? 0);
          if (countDiff !== 0) return countDiff;
          const aLen = Array.isArray(a.commentIds) ? a.commentIds.length : 0;
          const bLen = Array.isArray(b.commentIds) ? b.commentIds.length : 0;
          return bLen - aLen;
        });
        res.setHeader('Cache-Control', 'no-store');
        res.json({ ...analysis, patterns: sortedPatterns });
        return;
      }

      // Fallback: perform analysis if not found in research data
      res.status(404).json({ error: 'Pattern analysis not available. Please run "Start Research" first.' });
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

      // Validate pattern type
      const validPatternTypes = ['myth', 'failure', 'advice', 'validation', 'feature_request', 'comparison', 'workaround', 'emotion'];
      if (!validPatternTypes.includes(patternType)) {
        res.status(400).json({ error: `Invalid pattern type: ${patternType}` });
        return;
      }

      // Get pattern analysis from stored research data
      const researchData = await getSupabaseClient()
        .from('research_data')
        .select('comment_pattern_analysis')
        .eq('project_id', projectId)
        .maybeSingle();

      if (!researchData.data?.comment_pattern_analysis) {
        res.status(404).json({ error: 'Pattern analysis not available. Please run "Start Research" first.' });
        return;
      }

      const patternAnalysis = researchData.data.comment_pattern_analysis as any;
      const rawPatterns = patternAnalysis.patterns ?? [];
      // Use same order as GET /patterns: by count desc, then by commentIds length desc so patternIndex matches the list
      const patterns = [...rawPatterns].sort((a: any, b: any) => {
        const countDiff = (b.count ?? 0) - (a.count ?? 0);
        if (countDiff !== 0) return countDiff;
        const aLen = Array.isArray(a.commentIds) ? a.commentIds.length : 0;
        const bLen = Array.isArray(b.commentIds) ? b.commentIds.length : 0;
        return bLen - aLen;
      });
      const rawIndex = req.query.patternIndex;
      const patternIndex = typeof rawIndex === 'string' && /^\d+$/.test(rawIndex) ? parseInt(rawIndex, 10) : -1;
      const pattern =
        patternIndex >= 0 && patternIndex < patterns.length
          ? patterns[patternIndex]
          : patterns.find((p: any) => p.type === patternType);

      if (!pattern) {
        res.status(404).json({ error: `Pattern '${patternType}' not found in analysis` });
        return;
      }

      const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      // Client may send commentIds from analysis so "Show N comments" works even when DB format differs
      const queryIdsRaw = req.query.commentIds;
      const fromQuery =
        typeof queryIdsRaw === 'string' && queryIdsRaw.length > 0
          ? [...new Set(queryIdsRaw.split(',').map((s) => s.trim()).filter((s) => uuidLike.test(s)))]
          : [];

      // Flatten: support commentIds as nested arrays or mixed shapes
      const flattenIds = (arr: any[]): any[] => arr.flatMap((x) => (Array.isArray(x) ? flattenIds(x) : [x]));
      const rawIds = fromQuery.length > 0 ? fromQuery : flattenIds(pattern.commentIds || []);
      const uuidFromString = (s: string): string | null => {
        const trimmed = String(s).trim();
        if (uuidLike.test(trimmed)) return trimmed;
        const match = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
        return match ? match[0]! : null;
      };
      const toIdString = (id: any): string => {
        if (id == null) return '';
        if (typeof id === 'string') return id;
        if (typeof id === 'object' && id !== null && typeof (id as { id?: unknown }).id === 'string') return (id as { id: string }).id;
        return String(id);
      };
      let commentIds = [...new Set(
        rawIds
          .map(toIdString)
          .filter((s) => s.length > 0)
          .flatMap((s) => {
            // Extract all UUIDs from string (e.g. "id: uuid1, uuid2" or JSON)
            const one = uuidFromString(s);
            if (one) return [one];
            const all = s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi);
            return all ? [...all] : [];
          })
          .filter((id): id is string => id != null && uuidLike.test(id))
      )];

      // Fallback: when stored commentIds are empty/wrong but pattern has examples, resolve IDs by matching example content to project comments
      if (commentIds.length === 0 && pattern.examples?.length) {
        const { data: projectComments } = await getSupabaseClient()
          .from('comments')
          .select('id, content')
          .eq('project_id', projectId)
          .limit(2000);
        if (projectComments?.length) {
          const norm = (s: string) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
          const words = (s: string) => norm(s).split(/\s+/).filter((w) => w.length >= 4);
          const matchedIds = new Set<string>();
          for (const ex of pattern.examples) {
            const exContent = typeof ex === 'object' && ex !== null && typeof (ex as any).content === 'string' ? (ex as any).content : '';
            const needle = norm(exContent).slice(0, 150);
            if (!needle) continue;
            for (const c of projectComments) {
              if (matchedIds.size >= 100) break;
              const hay = norm(c.content ?? '');
              if (hay.includes(needle) || needle.includes(hay)) matchedIds.add(c.id);
            }
          }
          if (matchedIds.size === 0) {
            const allWords = new Set<string>();
            for (const ex of pattern.examples) {
              const exContent = typeof ex === 'object' && ex !== null && typeof (ex as any).content === 'string' ? (ex as any).content : '';
              words(exContent).forEach((w) => allWords.add(w));
            }
            if (allWords.size >= 2) {
              const wordList = Array.from(allWords);
              for (const c of projectComments) {
                if (matchedIds.size >= 100) break;
                const commentWords = new Set(words(c.content ?? ''));
                const matchCount = wordList.filter((w) => commentWords.has(w)).length;
                if (matchCount >= 2) matchedIds.add(c.id);
              }
            }
          }
          commentIds = [...matchedIds];
        }
      }

      if (commentIds.length === 0) {
        res.setHeader('Cache-Control', 'no-store');
        res.json({ comments: [], total: 0, pattern: { type: pattern.type, label: pattern.label, count: pattern.count, percentage: pattern.percentage } });
        return;
      }

      // Get comments by IDs
      const { data: comments, error } = await getSupabaseClient()
        .from('comments')
        .select('*')
        .in('id', commentIds)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ error: `Failed to fetch comments: ${error.message}` });
        return;
      }

      // Return all comments by ID so "Show N comments" loads exactly N (no content filter)
      let commentsToReturn = comments ?? [];

      // When IDs from client/DB returned 0 rows (e.g. stale analysis), try matching by pattern examples to project comments
      if (commentsToReturn.length === 0 && pattern.examples?.length) {
        const { data: projectComments } = await getSupabaseClient()
          .from('comments')
          .select('*')
          .eq('project_id', projectId)
          .limit(2000);
        if (projectComments?.length) {
          const norm = (s: string) => String(s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
          const words = (s: string) => norm(s).split(/\s+/).filter((w) => w.length >= 4);
          const matchedIds = new Set<string>();
          for (const ex of pattern.examples) {
            const exContent = typeof ex === 'object' && ex !== null && typeof (ex as any).content === 'string' ? (ex as any).content : '';
            const needle = norm(exContent).slice(0, 150);
            if (!needle) continue;
            for (const c of projectComments) {
              if (matchedIds.size >= 100) break;
              const hay = norm(c.content ?? '');
              if (hay.includes(needle) || needle.includes(hay)) matchedIds.add(c.id);
            }
          }
          if (matchedIds.size === 0) {
            const allWords = new Set<string>();
            for (const ex of pattern.examples) {
              const exContent = typeof ex === 'object' && ex !== null && typeof (ex as any).content === 'string' ? (ex as any).content : '';
              words(exContent).forEach((w) => allWords.add(w));
            }
            if (allWords.size >= 2) {
              const wordList = Array.from(allWords);
              for (const c of projectComments) {
                if (matchedIds.size >= 100) break;
                const commentWords = new Set(words(c.content ?? ''));
                const matchCount = wordList.filter((w) => commentWords.has(w)).length;
                if (matchCount >= 2) matchedIds.add(c.id);
              }
            }
          }
          const fallbackIds = [...matchedIds];
          if (fallbackIds.length > 0) {
            const { data: fallbackRows } = await getSupabaseClient()
              .from('comments')
              .select('*')
              .in('id', fallbackIds)
              .order('created_at', { ascending: false });
            commentsToReturn = fallbackRows ?? [];
          }
        }
      }

      // Get source types for comments
      const uniqueSourceIds = [...new Set(commentsToReturn.map((c: any) => c.source_id))];
      const sourcesResult = await this._commentRepository.getCommentSourcesByProjectId(projectId);

      const sourceTypesMap = new Map<string, string>();
      if (sourcesResult.isSuccess) {
        sourcesResult.data.forEach(source => {
          if (uniqueSourceIds.includes(source.id)) {
            sourceTypesMap.set(source.id, source.sourceType);
          }
        });
      }

      // Format comments with source types
      const formattedComments = commentsToReturn.map((comment: any) => {
        let sourceType: string = sourceTypesMap.get(comment.source_id) || 'unknown';

        // Fallback: determine sourceType from URL pattern
        if (sourceType === 'unknown') {
          const url = (comment.context_url || comment.url).toLowerCase();
          if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) {
            sourceType = 'hackernews';
          } else {
            sourceType = 'reddit';
          }
        }

        return {
          id: comment.id,
          sourceId: comment.source_id,
          projectId: comment.project_id,
          externalId: comment.external_id,
          content: comment.content,
          author: comment.author,
          url: comment.url,
          contextTitle: comment.context_title,
          contextUrl: comment.context_url,
          createdAt: comment.created_at,
          fetchedAt: comment.fetched_at,
          isProcessed: comment.is_processed,
          processedAt: comment.processed_at,
          importOrigin: comment.import_origin,
          subsourceName: comment.subsource_name,
          sourceType
        };
      });

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        comments: formattedComments,
        total: formattedComments.length,
        pattern: {
          type: pattern.type,
          label: pattern.label,
          count: pattern.count,
          percentage: pattern.percentage
        }
      });
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