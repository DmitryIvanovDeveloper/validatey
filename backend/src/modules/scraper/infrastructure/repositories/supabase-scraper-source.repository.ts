import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { ScraperSourceRepositoryPort } from '../../application/ports/scraper-source-repository.port';
import type { ScraperSource } from '../../domain/entities/scraper-source.entity';
import { ScraperNotFoundError } from '../../domain/errors/scraper.error';

function mapRowToSource(row: Record<string, unknown>): ScraperSource {
  const researchGoal = row.research_goal != null && typeof row.research_goal === 'string'
    ? (row.research_goal as ScraperSource['researchGoal'])
    : null;
  const stopOnFirstError =
    row.stop_on_first_error === false ? false : true;
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    type: row.type as ScraperSource['type'],
    name: row.name != null ? String(row.name) : null,
    researchGoal,
    urls: Array.isArray(row.urls) ? (row.urls as string[]) : [],
    whatToCollect: Array.isArray(row.what_to_collect) ? (row.what_to_collect as string[]) : [],
    frequency: row.frequency as ScraperSource['frequency'],
    aiProcessing: row.ai_processing as ScraperSource['aiProcessing'],
    customSelectors:
      row.custom_selectors && typeof row.custom_selectors === 'object'
        ? (row.custom_selectors as ScraperSource['customSelectors'])
        : null,
    stopOnFirstError,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

@injectable()
export class SupabaseScraperSourceRepository implements ScraperSourceRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(source: ScraperSource): Promise<ResultEx<ScraperSource, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_sources')
        .insert({
          id: source.id,
          project_id: source.projectId,
          type: source.type,
          name: source.name,
          research_goal: source.researchGoal ?? null,
          urls: source.urls,
          what_to_collect: source.whatToCollect,
          frequency: source.frequency,
          ai_processing: source.aiProcessing,
          custom_selectors: source.customSelectors ?? null,
          created_at: source.createdAt.toISOString(),
          updated_at: source.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-scraper-source-repository.create-error', { error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(mapRowToSource(data as Record<string, unknown>));
    } catch (err) {
      this._logger.error('supabase-scraper-source-repository.create-exception', { error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async update(source: ScraperSource): Promise<ResultEx<ScraperSource, ScraperNotFoundError | Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_sources')
        .update({
          name: source.name,
          research_goal: source.researchGoal ?? null,
          urls: source.urls,
          what_to_collect: source.whatToCollect,
          frequency: source.frequency,
          ai_processing: source.aiProcessing,
          custom_selectors: source.customSelectors ?? null,
          stop_on_first_error: source.stopOnFirstError,
          updated_at: source.updatedAt.toISOString(),
        })
        .eq('id', source.id)
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-scraper-source-repository.update-error', { id: source.id, error });
        if (error.code === 'PGRST116') {
          return ResultEx.failure(new ScraperNotFoundError(source.id));
        }
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(mapRowToSource(data as Record<string, unknown>));
    } catch (err) {
      this._logger.error('supabase-scraper-source-repository.update-exception', { error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async findById(id: string): Promise<ResultEx<ScraperSource | null, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_sources')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        this._logger.error('supabase-scraper-source-repository.find-error', { id, error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(data ? mapRowToSource(data as Record<string, unknown>) : null);
    } catch (err) {
      this._logger.error('supabase-scraper-source-repository.find-exception', { id, error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<ScraperSource[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_sources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('supabase-scraper-source-repository.find-by-project-error', {
          projectId,
          error,
        });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success((data ?? []).map((row) => mapRowToSource(row as Record<string, unknown>)));
    } catch (err) {
      this._logger.error('supabase-scraper-source-repository.find-by-project-exception', {
        projectId,
        error: err,
      });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async delete(id: string, projectId: string): Promise<ResultEx<void, ScraperNotFoundError | Error>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('scraper_sources')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        this._logger.error('supabase-scraper-source-repository.delete-error', { id, error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(undefined);
    } catch (err) {
      this._logger.error('supabase-scraper-source-repository.delete-exception', { id, error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }
}
