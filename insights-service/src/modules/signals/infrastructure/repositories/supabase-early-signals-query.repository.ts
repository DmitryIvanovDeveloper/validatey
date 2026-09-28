import ResultEx from "../../../../infrastructure/result/result";
import { getSupabaseClient } from "../../../../infrastructure/database/supabase-client";
import type { EarlySignalsQueryRepositoryPort } from "../../application/ports/early-signals-query-repository.port";

export class SupabaseEarlySignalsQueryRepository implements EarlySignalsQueryRepositoryPort {
  async listByProjectId(
    projectId: string,
  ): Promise<ResultEx<Array<{ id: string; type: string; title: string; description: string; timestamp: string }>, Error>> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("early_signals")
      .select("id,type,title,description,created_at")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });
    if (error) return ResultEx.failure(new Error(error.message));
    const signals = ((data as Array<Record<string, unknown>> | null) ?? []).map((row) => ({
      id: String(row.id ?? ""),
      type: String(row.type ?? "neutral"),
      title: String(row.title ?? ""),
      description: String(row.description ?? ""),
      timestamp: new Date(String(row.created_at ?? new Date().toISOString())).toISOString(),
    }));
    return ResultEx.success(signals);
  }
}
