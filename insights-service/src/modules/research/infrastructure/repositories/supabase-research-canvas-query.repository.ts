import ResultEx from "../../../../infrastructure/result/result";
import { getSupabaseClient } from "../../../../infrastructure/database/supabase-client";
import type {
  ResearchCanvasQueryData,
  ResearchCanvasQueryRepositoryPort,
} from "../../application/ports/research-canvas-query-repository.port";

export class SupabaseResearchCanvasQueryRepository implements ResearchCanvasQueryRepositoryPort {
  async loadCanvasData(projectId: string): Promise<ResultEx<ResearchCanvasQueryData, Error>> {
    const supabase = getSupabaseClient();
    const [projectQ, researchQ, signalsQ] = await Promise.all([
      supabase.from("projects").select("name,hypothesis,scenario_template_slug").eq("id", projectId).maybeSingle(),
      supabase.from("research_data").select("*").eq("project_id", projectId).maybeSingle(),
      supabase
        .from("early_signals")
        .select("id,type,title,description,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true }),
    ]);

    if (projectQ.error) return ResultEx.failure(new Error(projectQ.error.message));
    if (researchQ.error) return ResultEx.failure(new Error(researchQ.error.message));
    if (signalsQ.error) return ResultEx.failure(new Error(signalsQ.error.message));

    return ResultEx.success({
      project: (projectQ.data as { name?: string; hypothesis?: { description?: string }; scenario_template_slug?: string } | null) ?? null,
      research: (researchQ.data as Record<string, unknown> | null) ?? {},
      signals:
        ((signalsQ.data as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
          id: String(row.id ?? ""),
          type: String(row.type ?? "neutral"),
          title: String(row.title ?? ""),
          description: String(row.description ?? ""),
        })),
    });
  }
}
