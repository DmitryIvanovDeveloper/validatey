import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { CommentFetcherPort, FetchCommentsInput } from '../ports/comment-fetcher.port';
import { CommentRepositoryPort } from '../ports/comment-repository.port';
import { CommentSourceRepositoryPort } from '../ports/comment-source-repository.port';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { CommentSourceValueObject } from '../../domain/value-objects/comment-source.vo';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentFetchError } from '../../domain/errors/comment.error';
import type { FetchCommentsUseCaseInput, FetchCommentsUseCaseOutput } from '../input-output/fetch-comments.io';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';

const SUBREDDIT_LLM_URL = process.env.SYNTHESIS_LLM_URL || 'https://cerebras-api.vercel.app/api/prompt';

const FALLBACK_SUBREDDITS = ['startups', 'SaaS', 'Entrepreneur', 'productivity', 'software'];

@injectable()
export class FetchCommentsUseCase {
  constructor(
    @inject(COMMENT_TYPES.CommentFetcher)
    private readonly _commentFetcher: CommentFetcherPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort,
    @inject(COMMENT_TYPES.CommentSourceRepository)
    private readonly _sourceRepository: CommentSourceRepositoryPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
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
      const { id: sourceId, source, cachedSubreddits } = sourceResult.data;

      // For Reddit search sources: AI generates both optimal search query and subreddits
      let subreddits: string[] | undefined;
      let aiSearchQuery: string | undefined;
      if (input.sourceType === 'reddit' && source.redditUrl?.startsWith('search:')) {
        const humanQuery = source.redditUrl.slice(7).trim();
        const config = await this._suggestRedditSearchConfig(sourceId, humanQuery, input.projectId);
        subreddits = config.subreddits;
        aiSearchQuery = config.searchQuery;
      }

      // Prepare fetch input based on source type
      const fetchInput: FetchCommentsInput = this._prepareFetchInput(input, source, subreddits, aiSearchQuery);
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
          subsourceName: source.subredditName ?? source.getDisplayName(),
          score: rawComment.score ?? null,
          depth: rawComment.depth ?? null,
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

  private async _ensureCommentSource(input: FetchCommentsUseCaseInput): Promise<ResultEx<{ id: string; source: CommentSourceValueObject; cachedSubreddits?: string[] }, CommentFetchError>> {
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
        // Use postId and subredditName from DB if available, otherwise parse from URL
        if (dbSource.postId && dbSource.subredditName) {
          console.log(`[EnsureCommentSource] Using postId and subredditName from DB: postId=${dbSource.postId}, subredditName=${dbSource.subredditName}`);
          // Create value object with DB values
          sourceValueObject = CommentSourceValueObject.createRedditWithIds(
            dbSource.redditUrl!,
            dbSource.postId,
            dbSource.subredditName
          );
        } else {
          console.log(`[EnsureCommentSource] postId or subredditName missing in DB, parsing from URL: ${dbSource.redditUrl}`);
          // Search sources have redditUrl = "search:<query>" — must use createRedditSearch, not createReddit
          if (dbSource.redditUrl!.startsWith('search:')) {
            const query = dbSource.redditUrl!.slice(7).trim();
            sourceValueObject = CommentSourceValueObject.createRedditSearch(query);
          } else {
            sourceValueObject = CommentSourceValueObject.createReddit(dbSource.redditUrl!);
            
            // Update DB with extracted values
            if (sourceValueObject.postId && sourceValueObject.subredditName) {
              console.log(`[EnsureCommentSource] Updating source ${dbSource.id} with extracted postId/subredditName`);
              const updateResult = await this._sourceRepository.update(dbSource.id, {
                postId: sourceValueObject.postId,
                subredditName: sourceValueObject.subredditName,
              });
              if (!updateResult.isSuccess) {
                console.warn(`[EnsureCommentSource] Failed to update source: ${updateResult.error.message}`);
              }
            }
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

      return ResultEx.success({ id: dbSource.id, source: sourceValueObject, cachedSubreddits: dbSource.subreddits });
    }

    // For Reddit (auto-search by query via Reddit JSON search API)
    if (input.sourceType === 'reddit' && input.redditSearchQuery?.trim()) {
      const query = input.redditSearchQuery.trim();
      const searchUrl = `search:${query}`;
      const sourceValueObject = CommentSourceValueObject.createRedditSearch(query);

      const existingSources = await this._sourceRepository.findByProjectId(input.projectId);
      if (!existingSources.isSuccess) {
        return ResultEx.failure(new CommentFetchError('Failed to check existing sources'));
      }

      // Find ANY existing Reddit search source (redditUrl starts with "search:")
      const existingSearchSource = existingSources.data.find(
        (s) => s.sourceType === 'reddit' && s.redditUrl?.startsWith('search:')
      );

      if (existingSearchSource) {
        if (existingSearchSource.redditUrl !== searchUrl) {
          // Query changed — delete stale comments and update the source URL
          console.log(`[EnsureCommentSource] Reddit search query changed, clearing stale comments for source ${existingSearchSource.id}`);
          await this._commentRepository.deleteBySourceId(existingSearchSource.id);
          await this._sourceRepository.update(existingSearchSource.id, { redditUrl: searchUrl });
        }
        return ResultEx.success({ id: existingSearchSource.id, source: sourceValueObject });
      }

      const createResult = await this._sourceRepository.create({
        projectId: input.projectId,
        sourceType: 'reddit',
        redditUrl: searchUrl,
      });
      return createResult.isSuccess
        ? ResultEx.success({ id: createResult.data.id, source: sourceValueObject })
        : ResultEx.failure(new CommentFetchError('Failed to create Reddit search source'));
    }

    // For Reddit (specific post or subreddit URL)
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

    // For Hacker News (search by query via Algolia)
    if (input.sourceType === 'hackernews' && input.hnSearchQuery?.trim()) {
      const query = input.hnSearchQuery.trim();
      const searchUrl = `search:${query}`;
      const sourceValueObject = CommentSourceValueObject.createHackerNews(searchUrl);

      const existingSources = await this._sourceRepository.findByProjectId(input.projectId);
      if (!existingSources.isSuccess) {
        return ResultEx.failure(new CommentFetchError('Failed to check existing sources'));
      }

      // Find ANY existing HN search source (hnUrl starts with "search:")
      const existingSearchSource = existingSources.data.find(
        (s) => s.sourceType === 'hackernews' && s.hnUrl?.startsWith('search:')
      );

      if (existingSearchSource) {
        if (existingSearchSource.hnUrl !== searchUrl) {
          // Query changed — delete stale comments and update the source URL
          console.log(`[EnsureCommentSource] HN search query changed, clearing stale comments for source ${existingSearchSource.id}`);
          await this._commentRepository.deleteBySourceId(existingSearchSource.id);
          await this._sourceRepository.update(existingSearchSource.id, { hnUrl: searchUrl });
        }
        return ResultEx.success({ id: existingSearchSource.id, source: sourceValueObject });
      }

      const createResult = await this._sourceRepository.create({
        projectId: input.projectId,
        sourceType: 'hackernews',
        hnUrl: searchUrl,
      });
      return createResult.isSuccess
        ? ResultEx.success({ id: createResult.data.id, source: sourceValueObject })
        : ResultEx.failure(new CommentFetchError('Failed to create comment source'));
    }

    // For Hacker News (feed or specific URL)
    if (input.sourceType === 'hackernews') {
      if (!input.hnFeedType && !input.hnUrl) {
        return ResultEx.failure(new CommentFetchError('Hacker News feed type or URL is required'));
      }
      const feedOrUrl = input.hnUrl ?? input.hnFeedType!;
      const sourceValueObject = CommentSourceValueObject.createHackerNews(feedOrUrl);

      const existingSources = await this._sourceRepository.findByProjectId(input.projectId);
      if (!existingSources.isSuccess) {
        return ResultEx.failure(new CommentFetchError('Failed to check existing sources'));
      }
      const existingSource = existingSources.data.find(
        (s) =>
          s.sourceType === 'hackernews' &&
          (s.hnUrl === input.hnUrl || s.hnFeedType === input.hnFeedType)
      );
      if (existingSource) {
        return ResultEx.success({ id: existingSource.id, source: sourceValueObject });
      }

      const createResult = await this._sourceRepository.create({
        projectId: input.projectId,
        sourceType: 'hackernews',
        hnFeedType: input.hnFeedType,
        hnUrl: input.hnUrl,
      });
      return createResult.isSuccess
        ? ResultEx.success({ id: createResult.data.id, source: sourceValueObject })
        : ResultEx.failure(new CommentFetchError('Failed to create comment source'));
    }

    return ResultEx.failure(new CommentFetchError('Unsupported source type'));
  }

  private _prepareFetchInput(input: FetchCommentsUseCaseInput, source: CommentSourceValueObject, subreddits?: string[], aiSearchQuery?: string): FetchCommentsInput {
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
      // Reddit Search source: redditUrl stores "search:<query>"
      if (source.redditUrl?.startsWith('search:')) {
        const humanQuery = source.redditUrl.slice(7).trim();
        // Prefer AI-generated query; fall back to human-written one
        const searchQuery = aiSearchQuery?.trim() || humanQuery;
        console.log(`[PrepareFetchInput] Reddit Search: ai_query="${aiSearchQuery ?? 'none'}", human_query="${humanQuery}", using="${searchQuery}", subreddits=${JSON.stringify(subreddits)}`);
        return {
          ...baseInput,
          sourceType: 'reddit',
          subredditNames: [],
          searchQuery,
          subreddits: subreddits && subreddits.length > 0 ? subreddits : undefined,
        };
      }

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
      const isSearch = source.hnUrl?.startsWith('search:');
      const searchQuery = isSearch ? source.hnUrl!.slice(7).trim() : undefined;
      console.log(`[PrepareFetchInput] Preparing HN input; itemId=${source.hnItemId}, searchQuery=${searchQuery ?? 'none'}`);
      return {
        ...baseInput,
        sourceType: 'hackernews',
        feedType: source.hnFeedType,
        itemId: source.hnItemId,
        searchQuery,
        limitStories: 50,
      };
    }
  }

  /**
   * Calls LLM to generate both an optimized search query AND relevant subreddits
   * based on current project hypotheses. Both are persisted to DB for visibility.
   */
  private async _suggestRedditSearchConfig(
    sourceId: string,
    humanQuery: string,
    projectId: string
  ): Promise<{ searchQuery: string; subreddits: string[] }> {
    try {
      const supabase = getSupabaseClient();
      const { data: assumptions } = await supabase
        .from('assumptions')
        .select('title, description')
        .eq('project_id', projectId)
        .limit(5);

      const hypothesisContext = assumptions && assumptions.length > 0
        ? assumptions.map((a: { title: string; description?: string }) =>
            `- ${a.title}${a.description ? ': ' + a.description : ''}`
          ).join('\n')
        : 'No hypothesis available';

      const prompt = `You are a Reddit research assistant. Given a startup hypothesis and a human-written search hint, generate the optimal Reddit search query and relevant subreddits.

Hypothesis:
${hypothesisContext}

Human search hint: "${humanQuery}"

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "searchQuery": "2-5 word query that finds real user discussions about this problem",
  "subreddits": ["sub1","sub2","sub3","sub4","sub5","sub6"]
}

Rules for searchQuery:
- Short and specific (2-5 words)
- Use terms TARGET USERS would write, not startup/founder jargon
- Avoid words like "app", "saas", "tool" unless that's how users talk
- Focus on the PAIN or BEHAVIOR described in the hypothesis

Rules for subreddits:
- 6 names without r/ prefix
- Where TARGET USERS (not builders/founders) discuss this pain
- Mix niche + broad communities`;

      const response = await this._http.post<{ response?: string }>(
        SUBREDDIT_LLM_URL,
        { prompt, model: 'llama3.3-70b', max_tokens: 300 },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );

      const content = (response?.response ?? '').trim();
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('No JSON object in LLM response');

      const parsed = JSON.parse(match[0]) as { searchQuery?: unknown; subreddits?: unknown };

      const searchQuery = typeof parsed.searchQuery === 'string' && parsed.searchQuery.trim()
        ? parsed.searchQuery.trim()
        : humanQuery;

      const subreddits = Array.isArray(parsed.subreddits)
        ? (parsed.subreddits as unknown[])
            .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
            .map(s => s.replace(/^r\//, '').trim())
            .slice(0, 8)
        : FALLBACK_SUBREDDITS;

      console.log(`[SuggestRedditConfig] query="${searchQuery}", subreddits=${subreddits.join(', ')}`);

      // Persist for visibility/debugging (best-effort)
      this._sourceRepository.update(sourceId, { subreddits, aiSearchQuery: searchQuery }).catch(err => {
        console.warn(`[SuggestRedditConfig] Failed to persist config:`, err);
      });

      return { searchQuery, subreddits: subreddits.length > 0 ? subreddits : FALLBACK_SUBREDDITS };
    } catch (err) {
      console.warn(`[SuggestRedditConfig] LLM failed, using human query as fallback:`, err instanceof Error ? err.message : err);
      return { searchQuery: humanQuery, subreddits: FALLBACK_SUBREDDITS };
    }
  }
}