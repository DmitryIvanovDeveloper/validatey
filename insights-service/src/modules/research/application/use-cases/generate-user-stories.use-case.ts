import ResultEx from "../../../../infrastructure/result/result";
import type { ResearchDataRepositoryPort } from "../ports/research-data-repository.port";

export class GenerateUserStoriesUseCase {
  constructor(private readonly repository: ResearchDataRepositoryPort) {}

  async execute(input: { projectId: string }): Promise<ResultEx<{ userStories: Array<Record<string, unknown>> }, Error>> {
    const data = await this.repository.findByProjectId(input.projectId);
    if (!data.isSuccess) return ResultEx.failure(data.error);
    return ResultEx.success({ userStories: data.data?.userStories ?? [] });
  }
}
