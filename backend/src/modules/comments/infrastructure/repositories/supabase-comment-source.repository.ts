import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { CommentSourceRepositoryPort, CommentSource, CreateCommentSourceInput } from '../../application/ports/comment-source-repository.port';
import { CommentSourceError } from '../../domain/errors/comment.error';

@injectable()
export class SupabaseCommentSourceRepository implements CommentSourceRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(input: CreateCommentSourceInput): Promise<ResultEx<CommentSource, CommentSourceError>> {
    try {
      console.log(`[CommentSource Create] Input:`, input);
      const supabase = getSupabaseClient();

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('comment_sources')
        .insert({
          project_id: input.projectId,
          source_type: input.sourceType,
          reddit_url: input.redditUrl,
          subreddit_name: input.subredditName,
          post_id: input.postId,
          hn_feed_type: input.hnFeedType,
          hn_url: input.hnUrl,
          hn_item_id: input.hnItemId,
          linkedin_url: input.linkedinUrl,
          linkedin_post_id: input.linkedinPostId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        this._logger.error('commentSource.create.error', { error, input });
        return ResultEx.failure(new CommentSourceError(`Failed to create comment source: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new CommentSourceError('No data returned from create operation'));
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