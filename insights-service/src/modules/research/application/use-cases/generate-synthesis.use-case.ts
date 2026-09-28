import ResultEx from "../../../../infrastructure/result/result";
import type { ResearchDataRepositoryPort } from "../ports/research-data-repository.port";

export class GenerateSynthesisUseCase {
  constructor(private readonly repository: ResearchDataRepositoryPort) {}

  async execute(input: { projectId: string }): Promise<ResultEx<{ report: Record<string, unknown> }, Error>> {
    const data = await this.repository.findByProjectId(input.projectId);
    if (!data.isSuccess) return ResultEx.failure(data.error);
    const report = data.data?.synthesisReport;
    if (!report) return ResultEx.failure(new Error("Synthesis report not available"));
    return ResultEx.success({ report });
  }
}
