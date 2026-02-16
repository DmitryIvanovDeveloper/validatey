import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Workspace } from '../../domain/entities/workspace.entity';
import { WorkspaceNotFoundError, InvalidWorkspaceDataError } from '../../domain/errors/workspace.error';
import { WorkspaceRepositoryPort } from '../../application/ports/workspace-repository.port';

@injectable()
export class SupabaseWorkspaceRepository implements WorkspaceRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(workspace: Workspace): Promise<ResultEx<Workspace, InvalidWorkspaceDataError>> {
    try {
      const supabase = getSupabaseClient();

      const nowIso = new Date().toISOString();
      const created_at = workspace.createdAt != null && typeof workspace.createdAt.toISOString === 'function'
        ? workspace.createdAt.toISOString()
        : nowIso;
      const updated_at = workspace.updatedAt != null && typeof workspace.updatedAt.toISOString === 'function'
        ? workspace.updatedAt.toISOString()
        : nowIso;

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          id: workspace.id,
          user_id: workspace.userId,
          name: workspace.name,
          icon_url: workspace.iconUrl ?? null,
          created_at,
          updated_at,
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-workspace-repository.create-error', { error });
        return ResultEx.failure(new InvalidWorkspaceDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-workspace-repository.create-exception', { error });
      return ResultEx.failure(
        new InvalidWorkspaceDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Workspace, WorkspaceNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('workspaces').select('*').eq('id', id).single();

      if (error) {
        this._logger.error('supabase-workspace-repository.find-by-id-error', {
          id,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        });
        // PGRST116 = no rows returned
        if (error.code === 'PGRST116') {
          return ResultEx.failure(new WorkspaceNotFoundError(id));
        }
        // Other errors might be RLS or connection issues
        this._logger.warn('supabase-workspace-repository.find-by-id-unexpected-error', {
          id,
          errorCode: error.code,
          hint: 'This might be an RLS policy issue. Check if SUPABASE_SERVICE_ROLE_KEY is set in .env'
        });
        return ResultEx.failure(new WorkspaceNotFoundError(id));
      }

      if (!data) {
        this._logger.error('supabase-workspace-repository.find-by-id-no-data', { id });
        return ResultEx.failure(new WorkspaceNotFoundError(id));
      }

      try {
        const mapped = this.mapToDomain(data);
        return ResultEx.success(mapped);
      } catch (mapError) {
        this._logger.error('supabase-workspace-repository.find-by-id-map-error', {
          id,
          data,
          mapError: mapError instanceof Error ? mapError.message : String(mapError)
        });
        return ResultEx.failure(new WorkspaceNotFoundError(id));
      }
    } catch (error) {
      this._logger.error('supabase-workspace-repository.find-by-id-exception', {
        id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return ResultEx.failure(new WorkspaceNotFoundError(id));
    }
  }

  async findByUserId(userId: string): Promise<ResultEx<Workspace[], Error>> {
    try {
      const supabase = getSupabaseClient();
      this._logger.info('supabase-workspace-repository.find-by-user-id.start', { userId });

      const { data, error } = await supabase.from('workspaces').select('*').eq('user_id', userId).order('created_at', { ascending: false });

      if (error) {
        this._logger.error('supabase-workspace-repository.find-by-user-id-error', { userId, error: error.message, code: error.code });
        return ResultEx.failure(new Error(`Database error: ${error.message} (code: ${error.code})`));
      }

      if (!data || !Array.isArray(data)) {
        this._logger.info('supabase-workspace-repository.find-by-user-id.empty-result', { userId });
        return ResultEx.success([]);
      }

      try {
        const workspaces = data.map((item, index) => {
          try {
            return this.mapToDomain(item);
          } catch (mapError) {
            this._logger.error('supabase-workspace-repository.find-by-user-id.map-error', {
              userId,
              itemId: item?.id,
              error: mapError instanceof Error ? mapError.message : String(mapError)
            });
            throw mapError;
          }
        });
        this._logger.info('supabase-workspace-repository.find-by-user-id.success', { userId, count: workspaces.length });
        return ResultEx.success(workspaces);
      } catch (mapError) {
        this._logger.error('supabase-workspace-repository.find-by-user-id.mapping-failed', { userId, error: mapError });
        return ResultEx.failure(mapError instanceof Error ? mapError : new Error('Failed to map data to domain'));
      }
    } catch (error) {
      this._logger.error('supabase-workspace-repository.find-by-user-id-exception', { userId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(workspace: Workspace): Promise<ResultEx<Workspace, WorkspaceNotFoundError | InvalidWorkspaceDataError>> {
    try {
      const supabase = getSupabaseClient();

      // Prepare update data
      const updateData = {
        name: workspace.name,
        icon_url: workspace.iconUrl ?? null,
        updated_at: workspace.updatedAt != null && typeof workspace.updatedAt.toISOString === 'function'
          ? workspace.updatedAt.toISOString()
          : new Date().toISOString(),
      };

      // Log update attempt
      this._logger.info('supabase-workspace-repository.update-attempt', {
        id: workspace.id,
        hasName: !!workspace.name,
      });

      const { data, error } = await supabase
        .from('workspaces')
        .update(updateData)
        .eq('id', workspace.id)
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-workspace-repository.update-error', {
          id: workspace.id,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
        });

        if (error.code === 'PGRST116') {
          return ResultEx.failure(new WorkspaceNotFoundError(workspace.id));
        }
        return ResultEx.failure(new InvalidWorkspaceDataError(error.message));
      }

      if (!data) {
        this._logger.error('supabase-workspace-repository.update-no-data', { id: workspace.id });
        return ResultEx.failure(new WorkspaceNotFoundError(workspace.id));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this._logger.error('supabase-workspace-repository.update-exception', {
        id: workspace.id,
        error: errorMessage,
      });
      return ResultEx.failure(new InvalidWorkspaceDataError(errorMessage));
    }
  }

  async delete(id: string): Promise<ResultEx<void, WorkspaceNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.from('workspaces').delete().eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-workspace-repository.delete-not-found', { id });
          return ResultEx.failure(new WorkspaceNotFoundError(id));
        }
        this._logger.error('supabase-workspace-repository.delete-error', { error });
        return ResultEx.failure(new WorkspaceNotFoundError(id));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-workspace-repository.delete-exception', { id, error });
      return ResultEx.failure(new WorkspaceNotFoundError(id));
    }
  }

  private mapToDomain(data: Record<string, unknown>): Workspace {
    if (!data) {
      throw new Error('Cannot map null or undefined data to domain');
    }

    try {
      // Validate required fields
      if (!data.id || !data.user_id || !data.name) {
        throw new Error(`Missing required fields: id=${data.id}, user_id=${data.user_id}, name=${data.name}`);
      }

      // Parse dates safely
      const created_at_raw = data.created_at ?? data.createdAt;
      const updated_at_raw = data.updated_at ?? data.updatedAt;
      const createdAt = created_at_raw ? new Date(created_at_raw as string | number) : new Date();
      const updatedAt = updated_at_raw ? new Date(updated_at_raw as string | number) : new Date();

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
        iconUrl: (data.icon_url ?? null) as string | null,
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