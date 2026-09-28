import { getSupabaseClient } from "../../../../infrastructure/database/supabase-client";
import ResultEx from "../../../../infrastructure/result/result";
import type { ScraperRunRepositoryPort } from "../../application/ports/scraper-run-repository.port";
import type { ScraperRun } from "../../domain/entities/scraper-run.entity";
import type { RunStats } from "../../domain/value-objects/run-stats.vo";

function mapRowToRun(row: Record<string, unknown>): ScraperRun {
  return {
    id: String(row.id),
    scraperSourceId: String(row.scraper_source_id),
    projectId: String(row.project_id),
    status: row.status as ScraperRun["status"],
    startedAt: row.started_at ? new Date(String(row.started_at)) : null,
    completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
    errorMessage: row.error_message != null ? String(row.error_message) : null,
    rawResult: row.raw_result && typeof row.raw_result === "object" ? (row.raw_result as Record<string, unknown>) : null,
    insightsSummary: row.insights_summary != null ? String(row.insights_summary) : null,
    stats: row.run_stats && typeof row.run_stats === "object" ? (row.run_stats as RunStats) : null,
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

export class SupabaseScraperRunRepository implements ScraperRunRepositoryPort {
  async create(run: ScraperRun): Promise<ResultEx<ScraperRun, Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("scraper_runs")
      .insert({
        id: run.id,
        scraper_source_id: run.scraperSourceId,
        project_id: run.projectId,
        status: run.status,
        started_at: run.startedAt?.toISOString() ?? null,
        completed_at: run.completedAt?.toISOString() ?? null,
        error_message: run.errorMessage,
        raw_result: run.rawResult,
        insights_summary: run.insightsSummary,
        run_stats: run.stats,
        created_at: run.createdAt.toISOString(),
        updated_at: run.updatedAt.toISOString(),
      })
      .select("*")
      .single();
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success(mapRowToRun(data as Record<string, unknown>));
  }

  async update(run: ScraperRun): Promise<ResultEx<ScraperRun, Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("scraper_runs")
      .update({
        status: run.status,
        started_at: run.startedAt?.toISOString() ?? null,
        completed_at: run.completedAt?.toISOString() ?? null,
        error_message: run.errorMessage,
        raw_result: run.rawResult,
        insights_summary: run.insightsSummary,
        run_stats: run.stats,
        updated_at: run.updatedAt.toISOString(),
      })
      .eq("id", run.id)
      .select("*")
      .single();
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success(mapRowToRun(data as Record<string, unknown>));
  }

  async findById(id: string): Promise<ResultEx<ScraperRun | null, Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("scraper_runs").select("*").eq("id", id).maybeSingle();
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success(data ? mapRowToRun(data as Record<string, unknown>) : null);
  }

  async findByScraperSourceId(projectId: string, scraperSourceId: string, limit = 50): Promise<ResultEx<ScraperRun[], Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("scraper_runs")
      .select("*")
      .eq("project_id", projectId)
      .eq("scraper_source_id", scraperSourceId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success(((data as Record<string, unknown>[] | null) ?? []).map(mapRowToRun));
  }

  async findLatestByProjectId(projectId: string, limit = 50): Promise<ResultEx<ScraperRun[], Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("scraper_runs")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) return ResultEx.failure(new Error(error.message));
    return ResultEx.success(((data as Record<string, unknown>[] | null) ?? []).map(mapRowToRun));
  }
}
