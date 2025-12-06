import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Project } from '../../domain/entities/project.entity';
import { ProjectNotFoundError, InvalidProjectDataError } from '../../domain/errors/project.error';
import { ProjectRepositoryPort } from '../../application/ports/project-repository.port';

@injectable()
export class SupabaseProjectRepository implements ProjectRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(project: Project): Promise<ResultEx<Project, InvalidProjectDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: project.id,
          user_id: project.userId,
          name: project.name,
          status: project.status,
          segment: project.segment,
          hypothesis: project.hypothesis,
          target_audience: project.targetAudience,
          cost: project.cost,
          created_at: project.createdAt.toISOString(),
          updated_at: project.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-project-repository.create-error', { error });
        return ResultEx.failure(new InvalidProjectDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-project-repository.create-exception', { error });
      return ResultEx.failure(
        new InvalidProjectDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Project, ProjectNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

      if (error || !data) {
        this._logger.error('supabase-project-repository.find-by-id-error', { id, error });
        return ResultEx.failure(new ProjectNotFoundError(id));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-project-repository.find-by-id-exception', { id, error });
      return ResultEx.failure(new ProjectNotFoundError(id));
    }
  }

  async findByUserId(userId: string): Promise<ResultEx<Project[], Error>> {
    try {
      console.log('[Repository] findByUserId start', { userId });
      const supabase = getSupabaseClient();
      console.log('[Repository] Supabase client obtained');

      this._logger.info('supabase-project-repository.find-by-user-id.start', { userId });

      const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      console.log('[Repository] Query executed', { hasError: !!error, dataCount: data?.length || 0 });

      if (error) {
        console.error('[Repository] Supabase error', { error: error.message, code: error.code, details: error });
        this._logger.error('supabase-project-repository.find-by-user-id-error', { userId, error: error.message, code: error.code });
        return ResultEx.failure(new Error(`Database error: ${error.message} (code: ${error.code})`));
      }

      this._logger.info('supabase-project-repository.find-by-user-id.data-received', { userId, count: data?.length || 0 });

      if (!data || !Array.isArray(data)) {
        console.log('[Repository] Empty result');
        this._logger.info('supabase-project-repository.find-by-user-id.empty-result', { userId });
        return ResultEx.success([]);
      }

      try {
        console.log('[Repository] Mapping data', { count: data.length });
        const projects = data.map((item, index) => {
          try {
            console.log(`[Repository] Mapping item ${index}`, { id: item?.id, name: item?.name });
            return this.mapToDomain(item);
          } catch (mapError) {
            console.error(`[Repository] Map error for item ${index}`, { item, error: mapError });
            this._logger.error('supabase-project-repository.find-by-user-id.map-error', { 
              userId, 
              itemId: item?.id, 
              error: mapError instanceof Error ? mapError.message : String(mapError) 
            });
            throw mapError;
          }
        });
        console.log('[Repository] Mapping successful', { count: projects.length });
        this._logger.info('supabase-project-repository.find-by-user-id.success', { userId, count: projects.length });
        return ResultEx.success(projects);
      } catch (mapError) {
        console.error('[Repository] Mapping failed', { error: mapError });
        this._logger.error('supabase-project-repository.find-by-user-id.mapping-failed', { userId, error: mapError });
        return ResultEx.failure(mapError instanceof Error ? mapError : new Error('Failed to map data to domain'));
      }
    } catch (error) {
      console.error('[Repository] Exception', { error, stack: error instanceof Error ? error.stack : undefined });
      this._logger.error('supabase-project-repository.find-by-user-id-exception', { userId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(project: Project): Promise<ResultEx<Project, ProjectNotFoundError | InvalidProjectDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('projects')
        .update({
          name: project.name,
          status: project.status,
          segment: project.segment,
          hypothesis: project.hypothesis,
          target_audience: project.targetAudience,
          cost: project.cost,
          updated_at: project.updatedAt.toISOString(),
        })
        .eq('id', project.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-project-repository.update-not-found', { id: project.id });
          return ResultEx.failure(new ProjectNotFoundError(project.id));
        }
        this._logger.error('supabase-project-repository.update-error', { error });
        return ResultEx.failure(new InvalidProjectDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-project-repository.update-exception', { error });
      return ResultEx.failure(
        new InvalidProjectDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async delete(id: string): Promise<ResultEx<void, ProjectNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-project-repository.delete-not-found', { id });
          return ResultEx.failure(new ProjectNotFoundError(id));
        }
        this._logger.error('supabase-project-repository.delete-error', { error });
        return ResultEx.failure(new ProjectNotFoundError(id));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-project-repository.delete-exception', { id, error });
      return ResultEx.failure(new ProjectNotFoundError(id));
    }
  }

  private mapToDomain(data: any): Project {
    if (!data) {
      throw new Error('Cannot map null or undefined data to domain');
    }

    try {
      // Validate required fields
      if (!data.id || !data.user_id || !data.name || !data.status) {
        throw new Error(`Missing required fields: id=${data.id}, user_id=${data.user_id}, name=${data.name}, status=${data.status}`);
      }

      // Parse cost safely
      let cost: number | null = null;
      if (data.cost !== null && data.cost !== undefined) {
        const parsed = typeof data.cost === 'string' ? parseFloat(data.cost) : Number(data.cost);
        cost = isNaN(parsed) ? null : parsed;
      }

      // Parse dates safely
      const createdAt = data.created_at ? new Date(data.created_at) : new Date();
      const updatedAt = data.updated_at ? new Date(data.updated_at) : new Date();

      // Validate dates
      if (isNaN(createdAt.getTime())) {
        throw new Error(`Invalid created_at: ${data.created_at}`);
      }
      if (isNaN(updatedAt.getTime())) {
        throw new Error(`Invalid updated_at: ${data.updated_at}`);
      }

      return {
        id: String(data.id),
        userId: String(data.user_id),
        name: String(data.name),
        status: String(data.status) as 'draft' | 'active' | 'completed' | 'archived',
        segment: data.segment || null,
        hypothesis: data.hypothesis || null,
        targetAudience: data.target_audience || null,
        cost,
        createdAt,
        updatedAt,
      };
    } catch (error) {
      this._logger.error('mapToDomain-error', { 
        data, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

