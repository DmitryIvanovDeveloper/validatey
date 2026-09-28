import ResultEx from "../../../../infrastructure/result/result";

export type ResearchCanvasQueryData = {
  project: { name?: string; hypothesis?: { description?: string }; scenario_template_slug?: string } | null;
  research: Record<string, unknown>;
  signals: Array<{ id: string; type: string; title: string; description: string }>;
};

export interface ResearchCanvasQueryRepositoryPort {
  loadCanvasData(projectId: string): Promise<ResultEx<ResearchCanvasQueryData, Error>>;
}
