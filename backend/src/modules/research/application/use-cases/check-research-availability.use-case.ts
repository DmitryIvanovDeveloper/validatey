import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import { ResearchNotFoundError, ResearchCooldownError } from '../../domain/errors/research.error';

export interface CheckResearchAvailabilityRequest {
  readonly projectId: string;
}

export interface CheckResearchAvailabilityResponse {
  readonly available: boolean;
  readonly nextAvailableAt: Date | null;
  readonly timeUntilNext: number; // milliseconds
  readonly formattedTimeRemaining?: string;
}

@injectable()
export class CheckResearchAvailabilityUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchRepository: ResearchDataRepositoryPort
  ) {}

  async execute(
    request: CheckResearchAvailabilityRequest
  ): Promise<ResultEx<CheckResearchAvailabilityResponse, ResearchNotFoundError | Error>> {
    const { projectId }: CheckResearchAvailabilityRequest = request;
    this._logger.info('check-research-availability.start', { projectId });

    try {
      const result = await this._researchRepository.findByProjectId(projectId);
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }

      const stored = result.data;
      const lastRun: Date | null | undefined = stored?.lastResearchRunAt;

      if (!lastRun) {
        // Первый запуск - всегда доступен
        const response: CheckResearchAvailabilityResponse = {
          available: true,
          nextAvailableAt: null,
          timeUntilNext: 0
        };
        return ResultEx.success(response);
      }

      const now: Date = new Date();
      const cooldownMs: number = 24 * 60 * 60 * 1000; // 24 часа в миллисекундах
      const nextAvailable: Date = new Date(lastRun.getTime() + cooldownMs);
      const timeUntilNext: number = Math.max(0, nextAvailable.getTime() - now.getTime());

      const response: CheckResearchAvailabilityResponse = {
        available: timeUntilNext === 0,
        nextAvailableAt: nextAvailable,
        timeUntilNext,
        formattedTimeRemaining: timeUntilNext > 0 ? ResearchCooldownError.formatTimeRemaining(timeUntilNext) : undefined
      };

      return ResultEx.success(response);
    } catch (error: unknown) {
      this._logger.error('check-research-availability.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}