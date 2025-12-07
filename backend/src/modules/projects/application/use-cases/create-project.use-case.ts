import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectEntity } from '../../domain/entities/project.entity';
import { InvalidProjectDataError } from '../../domain/errors/project.error';
import { ProjectRepositoryPort } from '../ports/project-repository.port';
import { CreateProjectUseCaseRequest, CreateProjectUseCaseResponse } from './input-output/create-project.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CreateProjectUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(
    request: CreateProjectUseCaseRequest
  ): Promise<ResultEx<CreateProjectUseCaseResponse, InvalidProjectDataError>> {
    this._logger.info('create-project.start', { userId: request.userId, name: request.name });

    try {
      const project = ProjectEntity.create(
        request.userId,
        request.name,
        request.segment,
        request.hypothesis,
        request.targetAudience,
        request.cost
      );

      const saveResult = await this._repository.create(project.toData());

      if (!saveResult.isSuccess) {
        this._logger.error('create-project.repository-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      this._logger.info('create-project.success', { projectId: saveResult.data.id });

      return ResultEx.success({
        project: saveResult.data,
      });
    } catch (error) {
      this._logger.error('create-project.error', { error });
      if (error instanceof InvalidProjectDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidProjectDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}


