import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { ScraperRunRepositoryPort } from '../../application/ports/scraper-run-repository.port';
import type { ScraperRun } from '../../domain/entities/scraper-run.entity';
import type { RunStats } from '../../domain/value-objects/run-stats.vo';

function mapRowToRun(row: Record<string, unknown>): ScraperRun {
  const runStats =
    row.run_stats && typeof row.run_stats === 'object'
      ? (row.run_stats as RunStats)
      : null;
  return {
    id: String(row.id),
    scraperSourceId: String(row.scraper_source_id),
    projectId: String(row.project_id),
    status: row.status as ScraperRun['status'],
    startedAt: row.started_at ? new Date(String(row.started_at)) : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    errorMessage: row.error_message != null ? String(row.error_message) : null,
    rawResult:
      row.raw_result && typeof row.raw_result === 'object'
        ? (row.raw_result as Record<string, unknown>)
        : null,
    insightsSummary: row.insights_summary != null ? String(row.insights_summary) : null,
    stats: runStats,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

@injectable()
export class SupabaseScraperRunRepository implements ScraperRunRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(run: ScraperRun): Promise<ResultEx<ScraperRun, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_runs')
        .insert({
          id: run.id,
          scraper_source_id: run.scraperSourceId,
          project_id: run.projectId,
          status: run.status,
          started_at: run.startedAt?.toISOString() ?? null,
          completed_at: run.completedAt?.toISOString() ?? null,
          error_message: run.errorMessage,
          raw_result: run.rawResult ?? null,
          insights_summary: run.insightsSummary ?? null,
          created_at: run.createdAt.toISOString(),
          updated_at: run.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-scraper-run-repository.create-error', { error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(mapRowToRun(data as Record<string, unknown>));
    } catch (err) {
      this._logger.error('supabase-scraper-run-repository.create-exception', { error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async update(run: ScraperRun): Promise<ResultEx<ScraperRun, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_runs')
        .update({
          status: run.status,
          started_at: run.startedAt?.toISOString() ?? null,
          completed_at: run.completedAt?.toISOString() ?? null,
          error_message: run.errorMessage,
          raw_result: run.rawResult ?? null,
          insights_summary: run.insightsSummary ?? null,
          run_stats: run.stats ?? null,
          updated_at: run.updatedAt.toISOString(),
        })
        .eq('id', run.id)
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-scraper-run-repository.update-error', { id: run.id, error });
        if (error.code === 'PGRST116') {
          return ResultEx.failure(new Error(`Scraper run not found: ${run.id}`));
        }
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(mapRowToRun(data as Record<string, unknown>));
    } catch (err) {
      this._logger.error('supabase-scraper-run-repository.update-exception', { error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async findById(id: string): Promise<ResultEx<ScraperRun | null, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_runs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        this._logger.error('supabase-scraper-run-repository.find-error', { id, error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(data ? mapRowToRun(data as Record<string, unknown>) : null);
    } catch (err) {
      this._logger.error('supabase-scraper-run-repository.find-exception', { id, error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async findByScraperSourceId(
    scraperSourceId: string,
    limit: number = 50
  ): Promise<ResultEx<ScraperRun[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_runs')
        .select('*')
        .eq('scraper_source_id', scraperSourceId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        this._logger.error('supabase-scraper-run-repository.find-by-source-error', {
          scraperSourceId,
          error,
        });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success((data ?? []).map((row) => mapRowToRun(row as Record<string, unknown>)));
    } catch (err) {
      this._logger.error('supabase-scraper-run-repository.find-by-source-exception', {
        scraperSourceId,
        error: err,
      });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async findLatestByProjectId(
    projectId: string,
    limit: number = 50
  ): Promise<ResultEx<ScraperRun[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scraper_runs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        this._logger.error('supabase-scraper-run-repository.find-by-project-error', {
          projectId,
          error,
        });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success((data ?? []).map((row) => mapRowToRun(row as Record<string, unknown>)));
    } catch (err) {
      this._logger.error('supabase-scraper-run-repository.find-by-project-exception', {
        projectId,
        error: err,
      });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }
}
