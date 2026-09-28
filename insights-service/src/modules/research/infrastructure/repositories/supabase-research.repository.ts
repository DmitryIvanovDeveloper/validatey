import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import { getSupabaseClient } from "../../../../infrastructure/database/supabase-client";
import type {
  ResearchDataRepositoryPort,
  StoredResearchDataLite,
} from "../../application/ports/research-data-repository.port";

export class SupabaseResearchRepository implements ResearchDataRepositoryPort {
  async findByProjectId(projectId: string): Promise<ResultEx<StoredResearchDataLite | null, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from("research_data")
        .select("project_id,last_research_run_at,synthesis_report,user_stories,research_status")
        .eq("project_id", projectId)
        .maybeSingle();

      if (error) {
        logger.error("supabase-research-repository.find-error", { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      if (!data) {
        return ResultEx.success(null);
      }

      return ResultEx.success({
        projectId: data.project_id as string,
        lastResearchRunAt: data.last_research_run_at ? new Date(data.last_research_run_at as string) : null,
        synthesisReport: (data.synthesis_report as Record<string, unknown> | null) ?? null,
        userStories: (data.user_stories as Array<Record<string, unknown>> | null) ?? null,
        researchStatus: (data.research_status as string | null) ?? null,
      });
    } catch (error) {
      logger.error("supabase-research-repository.find-exception", { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }

  async touchResearchRun(projectId: string): Promise<ResultEx<Date, Error>> {
    try {
      const supabase = getSupabaseClient();
      const now = new Date();
      const { error } = await supabase
        .from("research_data")
        .upsert(
          {
            project_id: projectId,
            last_research_run_at: now.toISOString(),
            updated_at: now.toISOString(),
            research_status: "idle",
            research_status_updated_at: now.toISOString(),
          },
          { onConflict: "project_id" },
        );
      if (error) return ResultEx.failure(new Error(error.message));
      return ResultEx.success(now);
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
