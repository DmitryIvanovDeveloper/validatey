import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { CommentSourceRepositoryPort, CommentSource, CreateCommentSourceInput, UpdateCommentSourceInput } from '../../application/ports/comment-source-repository.port';
import { CommentSourceError } from '../../domain/errors/comment.error';

@injectable()
export class SupabaseCommentSourceRepository implements CommentSourceRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(input: CreateCommentSourceInput): Promise<ResultEx<CommentSource, CommentSourceError>> {
    try {
      console.log(`[CommentSource Create] Input:`, JSON.stringify(input, null, 2));
      const supabase = getSupabaseClient();

      const now = new Date().toISOString();

      const insertData: Record<string, any> = {
        project_id: input.projectId,
        source_type: input.sourceType,
        created_at: now,
        updated_at: now,
      };
      
      // Only include fields that are defined (not undefined)
      if (input.redditUrl !== undefined) insertData.reddit_url = input.redditUrl;
      if (input.subredditName !== undefined) insertData.subreddit_name = input.subredditName;
      if (input.postId !== undefined) insertData.post_id = input.postId;
      if (input.hnFeedType !== undefined) insertData.hn_feed_type = input.hnFeedType;
      if (input.hnUrl !== undefined) insertData.hn_url = input.hnUrl;
      if (input.hnItemId !== undefined) insertData.hn_item_id = input.hnItemId;
      if (input.linkedinUrl !== undefined) insertData.linkedin_url = input.linkedinUrl;
      if (input.linkedinPostId !== undefined) insertData.linkedin_post_id = input.linkedinPostId;
      
      console.log(`[CommentSource Create] Inserting data:`, JSON.stringify(insertData, null, 2));
      console.log(`[CommentSource Create] Input values:`, {
        postId: input.postId,
        subredditName: input.subredditName,
        postIdType: typeof input.postId,
        subredditNameType: typeof input.subredditName
      });

      const { data, error } = await supabase
        .from('comment_sources')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        this._logger.error('commentSource.create.error', { error, input });
        return ResultEx.failure(new CommentSourceError(`Failed to create comment source: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new CommentSourceError('No data returned from create operation'));
      }

      console.log(`[CommentSource Create] Data returned from DB:`, JSON.stringify(data, null, 2));
      console.log(`[CommentSource Create] Raw DB values:`, {
        'data.post_id': data.post_id,
        'data.subreddit_name': data.subreddit_name,
        'data.post_id type': typeof data.post_id,
        'data.subreddit_name type': typeof data.subreddit_name,
        'data.post_id === null': data.post_id === null,
        'data.post_id === undefined': data.post_id === undefined,
        'data.subreddit_name === null': data.subreddit_name === null,
        'data.subreddit_name === undefined': data.subreddit_name === undefined
      });

      const source: CommentSource = {
        id: data.id,
        projectId: data.project_id,
        sourceType: data.source_type,
        redditUrl: data.reddit_url,
        subredditName: data.subreddit_name,
        postId: data.post_id,
        hnFeedType: data.hn_feed_type,
        hnUrl: data.hn_url,
        hnItemId: data.hn_item_id,
        linkedinUrl: data.linkedin_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      console.log(`[CommentSource Create] Created source object:`, {
        id: source.id,
        postId: source.postId,
        subredditName: source.subredditName,
        redditUrl: source.redditUrl,
        'source.postId type': typeof source.postId,
        'source.subredditName type': typeof source.subredditName
      });

      return ResultEx.success(source);
    } catch (error) {
      this._logger.error('commentSource.create.exception', { error, input });
      return ResultEx.failure(new CommentSourceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findById(id: string): Promise<ResultEx<CommentSource, CommentSourceError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('comment_sources')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return ResultEx.failure(new CommentSourceError(`Comment source with ID ${id} not found`));
        }
        this._logger.error('commentSource.findById.error', { error, id });
        return ResultEx.failure(new CommentSourceError(`Failed to find comment source: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new CommentSourceError(`Comment source with ID ${id} not found`));
      }

      const source: CommentSource = {
        id: data.id,
        projectId: data.project_id,
        sourceType: data.source_type,
        redditUrl: data.reddit_url,
        subredditName: data.subreddit_name,
        postId: data.post_id,
        hnFeedType: data.hn_feed_type,
        hnUrl: data.hn_url,
        hnItemId: data.hn_item_id,
        linkedinUrl: data.linkedin_url,
        linkedinPostId: data.linkedin_post_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return ResultEx.success(source);
    } catch (error) {
      this._logger.error('commentSource.findById.exception', { error, id });
      return ResultEx.failure(new CommentSourceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<CommentSource[], CommentSourceError>> {
    try {
      console.log(`[CommentSource Repository] Finding sources for project ${projectId}`);
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('comment_sources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log(`[CommentSource Repository] Database error:`, error);
        this._logger.error('commentSource.findByProjectId.error', { error, projectId });
        return ResultEx.failure(new CommentSourceError(`Failed to find comment sources: ${error.message}`));
      }

      if (!data) {
        console.log(`[CommentSource Repository] No data found`);
        return ResultEx.success([]);
      }

      console.log(`[CommentSource Repository] Found ${data.length} sources, mapping...`);

      const sources: CommentSource[] = data.map(row => ({
        id: row.id,
        projectId: row.project_id,
        sourceType: row.source_type,
        redditUrl: row.reddit_url,
        subredditName: row.subreddit_name,
        postId: row.post_id,
        hnFeedType: row.hn_feed_type,
        hnUrl: row.hn_url,
        hnItemId: row.hn_item_id,
        linkedinUrl: row.linkedin_url,
        linkedinPostId: row.linkedin_post_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      console.log(`[CommentSource Repository] Successfully mapped ${sources.length} sources`);
      return ResultEx.success(sources);
    } catch (error) {
      console.log(`[CommentSource Repository] Exception:`, error);
      this._logger.error('commentSource.findByProjectId.exception', { error, projectId });
      return ResultEx.failure(new CommentSourceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findAll(): Promise<ResultEx<CommentSource[], CommentSourceError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('comment_sources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('commentSource.findAll.error', { error });
        return ResultEx.failure(new CommentSourceError(`Failed to find comment sources: ${error.message}`));
      }

      if (!data) {
        return ResultEx.success([]);
      }

      const sources: CommentSource[] = data.map(row => ({
        id: row.id,
        projectId: row.project_id,
        sourceType: row.source_type,
        redditUrl: row.reddit_url,
        subredditName: row.subreddit_name,
        postId: row.post_id,
        hnFeedType: row.hn_feed_type,
        hnUrl: row.hn_url,
        hnItemId: row.hn_item_id,
        linkedinUrl: row.linkedin_url,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return ResultEx.success(sources);
    } catch (error) {
      this._logger.error('commentSource.findAll.exception', { error });
      return ResultEx.failure(new CommentSourceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async update(id: string, input: UpdateCommentSourceInput): Promise<ResultEx<CommentSource, CommentSourceError>> {
    try {
      console.log(`[CommentSource Update] Updating source ${id} with:`, input);
      const supabase = getSupabaseClient();

      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (input.subredditName !== undefined) updateData.subreddit_name = input.subredditName;
      if (input.postId !== undefined) updateData.post_id = input.postId;
      if (input.hnFeedType !== undefined) updateData.hn_feed_type = input.hnFeedType;
      if (input.hnUrl !== undefined) updateData.hn_url = input.hnUrl;
      if (input.hnItemId !== undefined) updateData.hn_item_id = input.hnItemId;
      if (input.linkedinUrl !== undefined) updateData.linkedin_url = input.linkedinUrl;
      if (input.linkedinPostId !== undefined) updateData.linkedin_post_id = input.linkedinPostId;

      const { data, error } = await supabase
        .from('comment_sources')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this._logger.error('commentSource.update.error', { error, id, input });
        return ResultEx.failure(new CommentSourceError(`Failed to update comment source: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new CommentSourceError(`Comment source with ID ${id} not found`));
      }

      const source: CommentSource = {
        id: data.id,
        projectId: data.project_id,
        sourceType: data.source_type,
        redditUrl: data.reddit_url,
        subredditName: data.subreddit_name,
        postId: data.post_id,
        hnFeedType: data.hn_feed_type,
        hnUrl: data.hn_url,
        hnItemId: data.hn_item_id,
        linkedinUrl: data.linkedin_url,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return ResultEx.success(source);
    } catch (error) {
      this._logger.error('commentSource.update.exception', { error, id, input });
      return ResultEx.failure(new CommentSourceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async delete(id: string): Promise<ResultEx<void, CommentSourceError>> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('comment_sources')
        .delete()
        .eq('id', id);

      if (error) {
        this._logger.error('commentSource.delete.error', { error, id });
        return ResultEx.failure(new CommentSourceError(`Failed to delete comment source: ${error.message}`));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('commentSource.delete.exception', { error, id });
      return ResultEx.failure(new CommentSourceError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }
}