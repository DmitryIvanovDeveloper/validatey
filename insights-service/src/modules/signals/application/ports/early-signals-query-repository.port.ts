import ResultEx from "../../../../infrastructure/result/result";

export interface EarlySignalsQueryRepositoryPort {
  listByProjectId(
    projectId: string,
  ): Promise<ResultEx<Array<{ id: string; type: string; title: string; description: string; timestamp: string }>, Error>>;
}
