import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { CommentEntity } from '../../domain/entities/comment.entity';
import { CommentRepositoryPort } from '../../application/ports/comment-repository.port';
import { CommentNotFoundError, CommentError } from '../../domain/errors/comment.error';

@injectable()
export class SupabaseCommentRepository implements CommentRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async save(comment: CommentEntity): Promise<ResultEx<CommentEntity, CommentError>> {
    try {
      const supabase = getSupabaseClient();
      const commentData = comment.toData();

      const { error } = await supabase
        .from('comments')
        .upsert({
          id: commentData.id,
          source_id: commentData.sourceId,
          project_id: commentData.projectId,
          external_id: commentData.externalId,
          content: commentData.content,
          author: commentData.author,
          url: commentData.url,
          context_title: commentData.contextTitle,
          context_url: commentData.contextUrl,
          created_at: commentData.createdAt.toISOString(),
          fetched_at: commentData.fetchedAt.toISOString(),
          is_processed: commentData.isProcessed,
          processed_at: commentData.processedAt?.toISOString() ?? null,
          import_origin: commentData.importOrigin,
          subsource_name: commentData.subsourceName,
          score: commentData.score,
          depth: commentData.depth,
        });

      if (error) {
        this._logger.error('comment.save.error', { error, commentId: comment.id });
        return ResultEx.failure(new CommentError(`Failed to save comment: ${error.message}`));
      }

      return ResultEx.success(comment);
    } catch (error) {
      this._logger.error('comment.save.exception', { error, commentId: comment.id });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async bulkSave(comments: CommentEntity[]): Promise<ResultEx<CommentEntity[], CommentError>> {
    try {
      const supabase = getSupabaseClient();

      console.log(`[Comment Repository] Bulk saving ${comments.length} comments`);

      const commentsData = comments.map(comment => {
        const data = comment.toData();
        return {
          id: data.id,
          source_id: data.sourceId,
          project_id: data.projectId,
          external_id: data.externalId,
          content: data.content,
          author: data.author,
          url: data.url,
          context_title: data.contextTitle,
          context_url: data.contextUrl,
          created_at: data.createdAt.toISOString(),
          fetched_at: data.fetchedAt.toISOString(),
          is_processed: data.isProcessed,
          processed_at: data.processedAt?.toISOString() ?? null,
          import_origin: data.importOrigin,
          subsource_name: data.subsourceName,
        };
      });

      console.log(`[Comment Repository] Prepared ${commentsData.length} comment records for insertion`);

      const { error } = await supabase
        .from('comments')
        .upsert(commentsData, { onConflict: 'source_id,external_id', ignoreDuplicates: true });

      if (error) {
        this._logger.error('comment.bulkSave.error', { error, count: comments.length });
        return ResultEx.failure(new CommentError(`Failed to bulk save comments: ${error.message}`));
      }

      return ResultEx.success(comments);
    } catch (error) {
      this._logger.error('comment.bulkSave.exception', { error, count: comments.length });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findById(id: string): Promise<ResultEx<CommentEntity, CommentNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return ResultEx.failure(new CommentNotFoundError(id));
        }
        this._logger.error('comment.findById.error', { error, id });
        return ResultEx.failure(new CommentError(`Failed to find comment: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new CommentNotFoundError(id));
      }

      try {
        const comment = CommentEntity.create({
          id: data.id,
          sourceId: data.source_id,
          projectId: data.project_id,
          externalId: data.external_id,
          content: data.content,
          author: data.author,
          url: data.url,
          contextTitle: data.context_title,
          contextUrl: data.context_url,
          createdAt: new Date(data.created_at),
          fetchedAt: new Date(data.fetched_at),
          isProcessed: data.is_processed ?? false,
          processedAt: data.processed_at ? new Date(data.processed_at) : undefined,
          importOrigin: data.import_origin,
          subsourceName: data.subsource_name,
          score: data.score ?? undefined,
          depth: data.depth ?? undefined,
        });

        return ResultEx.success(comment);
      } catch (createError) {
        this._logger.error('comment.findById.createError', { error: createError, id, data });
        return ResultEx.failure(new CommentError('Failed to create comment entity from data'));
      }
    } catch (error) {
      this._logger.error('comment.findById.exception', { error, id });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findByProjectId(
    projectId: string,
    options?: {
      limit?: number;
      offset?: number;
      isProcessed?: boolean;
      orderByCreatedAt?: boolean; // New option to control sorting
    }
  ): Promise<ResultEx<CommentEntity[], CommentError>> {
    try {
      console.log(`[SupabaseCommentRepository] findByProjectId: projectId=${projectId}, options=`, options);
      const supabase = getSupabaseClient();
      let query = supabase
        .from('comments')
        .select('*')
        .eq('project_id', projectId);

      // Add sorting only if requested (can be slow for large datasets)
      if (options?.orderByCreatedAt) {
        query = query.order('created_at', { ascending: false });
      }

      if (options?.isProcessed !== undefined) {
        query = query.eq('is_processed', options.isProcessed);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      let data, error;
      try {
        // Increase timeout for comment queries (can be large datasets)
        const queryPromise = query;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout after 60 seconds')), 60000);
        });

        const result = await Promise.race([queryPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
        console.log(`[SupabaseCommentRepository] Query completed: data.length=${data?.length || 0}, error=${error ? error.message : 'none'}`);
      } catch (queryError) {
        const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
        const errorName = queryError instanceof Error ? queryError.name : 'UnknownError';
        const errorStack = queryError instanceof Error ? queryError.stack : undefined;
        console.error(`[SupabaseCommentRepository] Query exception for projectId ${projectId}:`, {
          errorName,
          errorMessage,
          errorStack,
          error: queryError
        });
        // Check if it's a termination error
        if (errorName === 'TypeError' && errorMessage.includes('terminated')) {
          console.warn(`[SupabaseCommentRepository] Request was terminated, returning empty array instead of error`);
          return ResultEx.success([]);
        }
        return ResultEx.failure(new CommentError(`Failed to find comments: ${errorName}: ${errorMessage}`));
      }

      if (error) {
        console.error(`[SupabaseCommentRepository] Query error for projectId ${projectId}:`, {
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        });
        this._logger.error('comment.findByProjectId.error', { error, projectId, options });
        return ResultEx.failure(new CommentError(`Failed to find comments: ${error.message}`));
      }

      if (!data) {
        return ResultEx.success([]);
      }

      try {
        const comments = data.map(row => CommentEntity.create({
          id: row.id,
          sourceId: row.source_id,
          projectId: row.project_id,
          externalId: row.external_id,
          content: row.content,
          author: row.author,
          url: row.url,
          contextTitle: row.context_title,
          contextUrl: row.context_url,
          createdAt: new Date(row.created_at),
          fetchedAt: new Date(row.fetched_at),
          isProcessed: row.is_processed ?? false,
          processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
          importOrigin: row.import_origin,
          subsourceName: row.subsource_name,
          score: row.score ?? undefined,
          depth: row.depth ?? undefined,
        }));

        return ResultEx.success(comments);
      } catch (createError) {
        this._logger.error('comment.findByProjectId.createError', { error: createError, projectId, count: data.length });
        return ResultEx.failure(new CommentError('Failed to create comment entities from data'));
      }
    } catch (error) {
      this._logger.error('comment.findByProjectId.exception', { error, projectId, options });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findBySourceId(
    sourceId: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<ResultEx<CommentEntity[], CommentError>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('comments')
        .select('*')
        .eq('source_id', sourceId)
        .order('created_at', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1);
      }

      let data, error;
      try {
        console.log(`[SupabaseCommentRepository] findBySourceId: sourceId=${sourceId}, options=`, options);
        // Add timeout wrapper to prevent hanging requests
        const queryPromise = query;
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Query timeout after 30 seconds')), 30000);
        });
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        data = result.data;
        error = result.error;
        console.log(`[SupabaseCommentRepository] Query completed: data.length=${data?.length || 0}, error=${error ? error.message : 'none'}`);
      } catch (queryError) {
        const errorMessage = queryError instanceof Error ? queryError.message : String(queryError);
        const errorName = queryError instanceof Error ? queryError.name : 'UnknownError';
        const errorStack = queryError instanceof Error ? queryError.stack : undefined;
        console.error(`[SupabaseCommentRepository] Query exception for sourceId ${sourceId}:`, {
          errorName,
          errorMessage,
          errorStack,
          error: queryError
        });
        // Check if it's a termination error
        if (errorName === 'TypeError' && errorMessage.includes('terminated')) {
          console.warn(`[SupabaseCommentRepository] Request was terminated, returning empty array instead of error`);
          return ResultEx.success([]);
        }
        return ResultEx.failure(new CommentError(`Failed to find comments: ${errorName}: ${errorMessage}`));
      }

      if (error) {
        console.error(`[SupabaseCommentRepository] Query error for sourceId ${sourceId}:`, {
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        });
        this._logger.error('comment.findBySourceId.error', { error, sourceId, options });
        return ResultEx.failure(new CommentError(`Failed to find comments: ${error.message}`));
      }

      if (!data) {
        return ResultEx.success([]);
      }

      try {
        const comments = data.map(row => CommentEntity.create({
          id: row.id,
          sourceId: row.source_id,
          projectId: row.project_id,
          externalId: row.external_id,
          content: row.content,
          author: row.author,
          url: row.url,
          contextTitle: row.context_title,
          contextUrl: row.context_url,
          createdAt: new Date(row.created_at),
          fetchedAt: new Date(row.fetched_at),
          isProcessed: row.is_processed ?? false,
          processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
          importOrigin: row.import_origin,
          subsourceName: row.subsource_name,
          score: row.score ?? undefined,
          depth: row.depth ?? undefined,
        }));

        return ResultEx.success(comments);
      } catch (createError) {
        this._logger.error('comment.findBySourceId.createError', { error: createError, sourceId, count: data.length });
        return ResultEx.failure(new CommentError('Failed to create comment entities from data'));
      }
    } catch (error) {
      this._logger.error('comment.findBySourceId.exception', { error, sourceId, options });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findByProjectIdAndIds(projectId: string, ids: string[]): Promise<ResultEx<CommentEntity[], CommentError>> {
    if (!ids.length) {
      return ResultEx.success([]);
    }
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', projectId)
        .in('id', ids)
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('comment.findByProjectIdAndIds.error', { error, projectId });
        return ResultEx.failure(new CommentError(`Failed to find comments: ${error.message}`));
      }

      if (!data || data.length === 0) {
        return ResultEx.success([]);
      }

      const comments = data.map(row => CommentEntity.create({
        id: row.id,
        sourceId: row.source_id,
        projectId: row.project_id,
        externalId: row.external_id,
        content: row.content,
        author: row.author,
        url: row.url,
        contextTitle: row.context_title,
        contextUrl: row.context_url,
        createdAt: new Date(row.created_at),
        fetchedAt: new Date(row.fetched_at),
        isProcessed: row.is_processed ?? false,
        processedAt: row.processed_at ? new Date(row.processed_at) : undefined,
        importOrigin: row.import_origin,
        subsourceName: row.subsource_name,
        score: row.score ?? undefined,
        depth: row.depth ?? undefined,
      }));

      return ResultEx.success(comments);
    } catch (error) {
      this._logger.error('comment.findByProjectIdAndIds.exception', { error, projectId });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async countByProjectId(projectId: string): Promise<ResultEx<number, CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      if (error) {
        this._logger.error('comment.countByProjectId.error', { error, projectId });
        return ResultEx.failure(new CommentError(`Failed to count comments: ${error.message}`));
      }

      return ResultEx.success(count || 0);
    } catch (error) {
      this._logger.error('comment.countByProjectId.exception', { error, projectId });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async deleteBySourceId(sourceId: string): Promise<ResultEx<number, CommentError>> {
    try {
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from('comments')
        .delete({ count: 'exact' })
        .eq('source_id', sourceId);
      if (error) {
        this._logger.error('comment.deleteBySourceId.error', { error, sourceId });
        return ResultEx.failure(new CommentError(`Failed to delete comments: ${error.message}`));
      }
      this._logger.info('comment.deleteBySourceId.success', { sourceId, deleted: count ?? 0 });
      return ResultEx.success(count ?? 0);
    } catch (error) {
      this._logger.error('comment.deleteBySourceId.exception', { error, sourceId });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async countBySourceId(sourceId: string): Promise<ResultEx<number, CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const { count, error } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('source_id', sourceId);

      if (error) {
        this._logger.error('comment.countBySourceId.error', { error, sourceId });
        return ResultEx.failure(new CommentError(`Failed to count comments: ${error.message}`));
      }

      return ResultEx.success(count || 0);
    } catch (error) {
      this._logger.error('comment.countBySourceId.exception', { error, sourceId });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async getCommentSourcesByProjectId(projectId: string): Promise<ResultEx<{ id: string; sourceType: 'reddit' | 'hackernews' }[], CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('comment_sources')
        .select('id, source_type')
        .eq('project_id', projectId);

      if (error) {
        this._logger.error('comment.getCommentSourcesByProjectId.error', { error, projectId });
        return ResultEx.failure(new CommentError(`Failed to get comment sources: ${error.message}`));
      }

      if (!data) {
        return ResultEx.success([]);
      }

      const sources = data.map(row => ({
        id: row.id,
        sourceType: row.source_type as 'reddit' | 'hackernews'
      }));

      return ResultEx.success(sources);
    } catch (error) {
      this._logger.error('comment.getCommentSourcesByProjectId.exception', { error, projectId });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }
}