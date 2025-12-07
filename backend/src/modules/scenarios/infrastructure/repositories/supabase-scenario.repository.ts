import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Scenario, ScenarioMetadata } from '../../domain/entities/scenario.entity';
import { ScenarioNotFoundError, InvalidScenarioDataError } from '../../domain/errors/scenario.error';
import { ScenarioRepositoryPort } from '../../application/ports/scenario-repository.port';

@injectable()
export class SupabaseScenarioRepository implements ScenarioRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(scenario: Scenario): Promise<ResultEx<Scenario, InvalidScenarioDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('scenarios')
        .insert({
          id: scenario.id,
          project_id: scenario.projectId,
          version: scenario.version,
          content: scenario.content,
          is_generated: scenario.isGenerated,
          is_edited: scenario.isEdited,
          metadata: scenario.metadata,
          created_at: scenario.createdAt.toISOString(),
          updated_at: scenario.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-scenario-repository.create-error', { error });
        return ResultEx.failure(new InvalidScenarioDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-scenario-repository.create-exception', { error });
      return ResultEx.failure(
        new InvalidScenarioDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Scenario, ScenarioNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('scenarios').select('*').eq('id', id).single();

      if (error || !data) {
        this._logger.error('supabase-scenario-repository.find-by-id-error', { id, error });
        return ResultEx.failure(new ScenarioNotFoundError(id));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-scenario-repository.find-by-id-exception', { id, error });
      return ResultEx.failure(new ScenarioNotFoundError(id));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<Scenario[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false });

      if (error) {
        this._logger.error('supabase-scenario-repository.find-by-project-id-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data.map((item) => this.mapToDomain(item)));
    } catch (error) {
      this._logger.error('supabase-scenario-repository.find-by-project-id-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByProjectIdAndVersion(
    projectId: string,
    version: number
  ): Promise<ResultEx<Scenario, ScenarioNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('scenarios')
        .select('*')
        .eq('project_id', projectId)
        .eq('version', version)
        .single();

      if (error || !data) {
        this._logger.error('supabase-scenario-repository.find-by-project-version-error', {
          projectId,
          version,
          error,
        });
        return ResultEx.failure(new ScenarioNotFoundError(`scenario for project ${projectId} version ${version}`));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-scenario-repository.find-by-project-version-exception', {
        projectId,
        version,
        error,
      });
      return ResultEx.failure(new ScenarioNotFoundError(`scenario for project ${projectId} version ${version}`));
    }
  }

  async update(scenario: Scenario): Promise<ResultEx<Scenario, ScenarioNotFoundError | InvalidScenarioDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('scenarios')
        .update({
          content: scenario.content,
          is_generated: scenario.isGenerated,
          is_edited: scenario.isEdited,
          metadata: scenario.metadata,
          updated_at: scenario.updatedAt.toISOString(),
        })
        .eq('id', scenario.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-scenario-repository.update-not-found', { id: scenario.id });
          return ResultEx.failure(new ScenarioNotFoundError(scenario.id));
        }
        this._logger.error('supabase-scenario-repository.update-error', { error });
        return ResultEx.failure(new InvalidScenarioDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-scenario-repository.update-exception', { error });
      return ResultEx.failure(
        new InvalidScenarioDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async getLatestVersion(projectId: string): Promise<ResultEx<number, Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('scenarios')
        .select('version')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No scenarios yet, return 0
          return ResultEx.success(0);
        }
        this._logger.error('supabase-scenario-repository.get-latest-version-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data.version || 0);
    } catch (error) {
      this._logger.error('supabase-scenario-repository.get-latest-version-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private mapToDomain(data: any): Scenario {
    return {
      id: data.id,
      projectId: data.project_id,
      version: data.version,
      content: data.content,
      isGenerated: data.is_generated,
      isEdited: data.is_edited,
      metadata: data.metadata as ScenarioMetadata | null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}


