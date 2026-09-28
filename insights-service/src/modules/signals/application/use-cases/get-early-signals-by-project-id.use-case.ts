import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { EarlySignalsQueryRepositoryPort } from "../ports/early-signals-query-repository.port";

export type EarlySignalDto = {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
};

export class GetEarlySignalsByProjectIdUseCase {
  constructor(private readonly repository: EarlySignalsQueryRepositoryPort) {}

  async execute(projectId: string): Promise<ResultEx<{ signals: EarlySignalDto[] }, Error>> {
    try {
      const repoResult = await this.repository.listByProjectId(projectId);
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      return ResultEx.success({ signals: repoResult.data });
    } catch (error) {
      logger.error("get-early-signals.exception", { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
