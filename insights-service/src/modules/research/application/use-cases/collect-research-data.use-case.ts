import ResultEx from "../../../../infrastructure/result/result";
import type { ResearchDataRepositoryPort } from "../ports/research-data-repository.port";

export class CollectResearchDataUseCase {
  constructor(private readonly repository: ResearchDataRepositoryPort) {}

  async execute(input: { projectId: string }): Promise<ResultEx<{ collected: boolean; collectedAt: string }, Error>> {
    const updated = await this.repository.touchResearchRun(input.projectId);
    if (!updated.isSuccess) return ResultEx.failure(updated.error);
    return ResultEx.success({ collected: true, collectedAt: updated.data.toISOString() });
  }
}
