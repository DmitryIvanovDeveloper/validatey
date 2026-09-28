import ResultEx from "../../../../infrastructure/result/result";
import type { ResearchDataRepositoryPort } from "../ports/research-data-repository.port";

export class ResearchAssistantUseCase {
  constructor(private readonly repository: ResearchDataRepositoryPort) {}

  async execute(input: { projectId: string; message: string }): Promise<ResultEx<{ reply: string }, Error>> {
    const data = await this.repository.findByProjectId(input.projectId);
    if (!data.isSuccess) return ResultEx.failure(data.error);
    const synthesis = data.data?.synthesisReport;
    if (!synthesis) return ResultEx.failure(new Error("Research context is not available"));

    const summary = typeof synthesis.summary === "string" ? synthesis.summary : "No synthesis summary available";
    const reply =
      input.message.trim().length > 0
        ? `Research context: ${summary}`
        : "Please provide a message for assistant response.";
    return ResultEx.success({ reply });
  }
}
