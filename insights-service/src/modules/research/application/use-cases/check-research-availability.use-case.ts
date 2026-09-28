import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import { ResearchCooldownError } from "../../domain/errors/research.error";
import type { ResearchDataRepositoryPort } from "../ports/research-data-repository.port";

export interface CheckResearchAvailabilityRequest {
  readonly projectId: string;
}

export interface CheckResearchAvailabilityResponse {
  readonly available: boolean;
  readonly nextAvailableAt: Date | null;
  readonly timeUntilNext: number;
  readonly formattedTimeRemaining?: string;
}

export class CheckResearchAvailabilityUseCase {
  constructor(private readonly repository: ResearchDataRepositoryPort) {}

  async execute(
    request: CheckResearchAvailabilityRequest,
  ): Promise<ResultEx<CheckResearchAvailabilityResponse, Error>> {
    const { projectId } = request;
    logger.info("check-research-availability.start", { projectId });

    try {
      const result = await this.repository.findByProjectId(projectId);
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }

      const stored = result.data;
      const lastRun = stored?.lastResearchRunAt;
      if (!lastRun) {
        return ResultEx.success({
          available: true,
          nextAvailableAt: null,
          timeUntilNext: 0,
        });
      }

      const cooldownMinutes =
        process.env.RESEARCH_COOLDOWN_MINUTES != null
          ? Math.max(0, parseInt(process.env.RESEARCH_COOLDOWN_MINUTES, 10) || 0)
          : 24 * 60;
      const cooldownMs = cooldownMinutes * 60 * 1000;
      const nextAvailableAt = new Date(lastRun.getTime() + cooldownMs);
      const timeUntilNext = Math.max(0, nextAvailableAt.getTime() - Date.now());

      return ResultEx.success({
        available: timeUntilNext === 0,
        nextAvailableAt,
        timeUntilNext,
        formattedTimeRemaining:
          timeUntilNext > 0 ? ResearchCooldownError.formatTimeRemaining(timeUntilNext) : undefined,
      });
    } catch (error) {
      logger.error("check-research-availability.exception", { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
