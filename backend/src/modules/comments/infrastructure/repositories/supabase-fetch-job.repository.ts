import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { FetchJobRepositoryPort, FetchJob, CreateFetchJobInput, UpdateFetchJobInput } from '../../application/ports/fetch-job-repository.port';
import { CommentError } from '../../domain/errors/comment.error';

@injectable()
export class SupabaseFetchJobRepository implements FetchJobRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(input: CreateFetchJobInput): Promise<ResultEx<FetchJob, CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from('fetch_jobs')
        .insert({
          source_id: input.sourceId,
          project_id: input.projectId,
          status: input.status || 'pending',
          started_at: null,
          completed_at: null,
          error_message: null,
          comments_count: 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();

      if (error) {
        this._logger.error('fetchJob.create.error', { error, input });
        return ResultEx.failure(new CommentError(`Failed to create fetch job: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new CommentError('No data returned from create operation'));
      }

      const job: FetchJob = {
        id: data.id,
        sourceId: data.source_id,
        projectId: data.project_id,
        status: data.status,
        startedAt: data.started_at ? new Date(data.started_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        errorMessage: data.error_message,
        commentsCount: data.comments_count || 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return ResultEx.success(job);
    } catch (error) {
      this._logger.error('fetchJob.create.exception', { error, input });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findById(id: string): Promise<ResultEx<FetchJob, CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('fetch_jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return ResultEx.failure(new CommentError(`Fetch job with ID ${id} not found`));
        }
        this._logger.error('fetchJob.findById.error', { error, id });
        return ResultEx.failure(new CommentError(`Failed to find fetch job: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new CommentError(`Fetch job with ID ${id} not found`));
      }

      const job: FetchJob = {
        id: data.id,
        sourceId: data.source_id,
        projectId: data.project_id,
        status: data.status,
        startedAt: data.started_at ? new Date(data.started_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        errorMessage: data.error_message,
        commentsCount: data.comments_count || 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return ResultEx.success(job);
    } catch (error) {
      this._logger.error('fetchJob.findById.exception', { error, id });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<FetchJob[], CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('fetch_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('fetchJob.findByProjectId.error', { error, projectId });
        return ResultEx.failure(new CommentError(`Failed to find fetch jobs: ${error.message}`));
      }

      if (!data) {
        return ResultEx.success([]);
      }

      const jobs: FetchJob[] = data.map(row => ({
        id: row.id,
        sourceId: row.source_id,
        projectId: row.project_id,
        status: row.status,
        startedAt: row.started_at ? new Date(row.started_at) : undefined,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        errorMessage: row.error_message,
        commentsCount: row.comments_count || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return ResultEx.success(jobs);
    } catch (error) {
      this._logger.error('fetchJob.findByProjectId.exception', { error, projectId });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findBySourceId(sourceId: string): Promise<ResultEx<FetchJob[], CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('fetch_jobs')
        .select('*')
        .eq('source_id', sourceId)
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('fetchJob.findBySourceId.error', { error, sourceId });
        return ResultEx.failure(new CommentError(`Failed to find fetch jobs: ${error.message}`));
      }

      if (!data) {
        return ResultEx.success([]);
      }

      const jobs: FetchJob[] = data.map(row => ({
        id: row.id,
        sourceId: row.source_id,
        projectId: row.project_id,
        status: row.status,
        startedAt: row.started_at ? new Date(row.started_at) : undefined,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        errorMessage: row.error_message,
        commentsCount: row.comments_count || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return ResultEx.success(jobs);
    } catch (error) {
      this._logger.error('fetchJob.findBySourceId.exception', { error, sourceId });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async findRunning(): Promise<ResultEx<FetchJob[], CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('fetch_jobs')
        .select('*')
        .eq('status', 'running')
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('fetchJob.findRunning.error', { error });
        return ResultEx.failure(new CommentError(`Failed to find running fetch jobs: ${error.message}`));
      }

      if (!data) {
        return ResultEx.success([]);
      }

      const jobs: FetchJob[] = data.map(row => ({
        id: row.id,
        sourceId: row.source_id,
        projectId: row.project_id,
        status: row.status,
        startedAt: row.started_at ? new Date(row.started_at) : undefined,
        completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
        errorMessage: row.error_message,
        commentsCount: row.comments_count || 0,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
      }));

      return ResultEx.success(jobs);
    } catch (error) {
      this._logger.error('fetchJob.findRunning.exception', { error });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async update(id: string, input: UpdateFetchJobInput): Promise<ResultEx<FetchJob, CommentError>> {
    try {
      const supabase = getSupabaseClient();

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.status !== undefined) updateData.status = input.status;
      if (input.startedAt !== undefined) updateData.started_at = input.startedAt?.toISOString() ?? null;
      if (input.completedAt !== undefined) updateData.completed_at = input.completedAt?.toISOString() ?? null;
      if (input.errorMessage !== undefined) updateData.error_message = input.errorMessage;
      if (input.commentsCount !== undefined) updateData.comments_count = input.commentsCount;

      const { data, error } = await supabase
        .from('fetch_jobs')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this._logger.error('fetchJob.update.error', { error, id, input });
        return ResultEx.failure(new CommentError(`Failed to update fetch job: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new CommentError(`Fetch job with ID ${id} not found`));
      }

      const job: FetchJob = {
        id: data.id,
        sourceId: data.source_id,
        projectId: data.project_id,
        status: data.status,
        startedAt: data.started_at ? new Date(data.started_at) : undefined,
        completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
        errorMessage: data.error_message,
        commentsCount: data.comments_count || 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      return ResultEx.success(job);
    } catch (error) {
      this._logger.error('fetchJob.update.exception', { error, id, input });
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }
}