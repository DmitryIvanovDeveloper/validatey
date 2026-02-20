import { randomUUID } from 'crypto';
import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as ROUNDS_TYPES } from '../../infrastructure/bootstrap/types';
import type { RoundRepositoryPort } from '../ports/round-repository.port';
import { RoundEntity } from '../../domain/entities/round.entity';
import type { InvalidRoundDataError } from '../../domain/errors/round.error';
import type { CreateRoundRequest, RoundViewDTO } from './input-output/round.io';
import { TYPES as SCENARIO_TYPES } from '../../../scenarios/infrastructure/bootstrap/types';
import type { GenerateScenarioUseCase } from '../../../scenarios/application/use-cases/generate-scenario.use-case';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';

function toViewDTO(round: {
  id: string;
  projectId: string;
  parentRoundId: string | null;
  title: string;
  status: string;
  type: string;
  sortOrder: number;
  results: unknown;
  createdAt: Date;
  updatedAt: Date;
}): RoundViewDTO {
  return {
    id: round.id,
    projectId: round.projectId,
    parentRoundId: round.parentRoundId,
    title: round.title,
    status: round.status,
    type: round.type,
    sortOrder: round.sortOrder,
    results: (round.results as RoundViewDTO['results']) ?? null,
    createdAt: round.createdAt.toISOString(),
    updatedAt: round.updatedAt.toISOString(),
  };
}

@injectable()
export class CreateRoundUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROUNDS_TYPES.RoundRepository)
    private readonly _repository: RoundRepositoryPort,
    @inject(SCENARIO_TYPES.GenerateScenarioUseCase)
    private readonly _generateScenarioUseCase: GenerateScenarioUseCase,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort
  ) {}

  async execute(
    request: CreateRoundRequest
  ): Promise<ResultEx<RoundViewDTO, InvalidRoundDataError | Error>> {
    this._logger.info('create-round.start', { projectId: request.projectId, type: request.type });

    try {
      const id = randomUUID();
      const entity = RoundEntity.create({
        id,
        projectId: request.projectId,
        parentRoundId: request.parentRoundId ?? null,
        title: request.title,
        type: request.type,
        sortOrder: request.sortOrder ?? 0,
      });
      const result = await this._repository.create(entity.toData());
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }

      // Auto-generate basic scenario for survey and interview rounds
      if (entity.type === 'survey' || entity.type === 'interview') {
        try {
          this._logger.info('create-round.generating-scenario', { projectId: request.projectId, roundId: id, type: entity.type });

          // Get project to extract user ID for scenario generation
          const projectResult = await this._projectRepository.findById(request.projectId);
          if (projectResult.isSuccess) {
            const scenarioResult = await this._generateScenarioUseCase.execute({
              projectId: request.projectId,
              userId: projectResult.data.userId,
              templateSlug: entity.type === 'survey' ? 'survey-basic' : 'interview-basic',
              metadata: {
                tone: 'professional',
                length: entity.type === 'survey' ? 5 : 8, // Shorter for surveys, longer for interviews
              },
            });

            if (scenarioResult.isSuccess) {
              this._logger.info('create-round.scenario-generated', {
                projectId: request.projectId,
                roundId: id,
                scenarioId: scenarioResult.data.scenario.id
              });
            } else {
              this._logger.warn('create-round.scenario-generation-failed', {
                projectId: request.projectId,
                roundId: id,
                error: scenarioResult.error.message
              });
              // Don't fail the round creation if scenario generation fails
            }
          }
        } catch (scenarioError) {
          this._logger.error('create-round.scenario-exception', {
            projectId: request.projectId,
            roundId: id,
            error: scenarioError
          });
          // Don't fail the round creation if scenario generation fails
        }
      }

      this._logger.info('create-round.success', { projectId: request.projectId, roundId: id });
      return ResultEx.success(toViewDTO(result.data));
    } catch (error) {
      this._logger.error('create-round.error', { projectId: request.projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
