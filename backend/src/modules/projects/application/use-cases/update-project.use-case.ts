import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectEntity } from '../../domain/entities/project.entity';
import { ProjectNotFoundError, ProjectAccessDeniedError, InvalidProjectDataError } from '../../domain/errors/project.error';
import { ProjectRepositoryPort } from '../ports/project-repository.port';
import { UpdateProjectUseCaseRequest, UpdateProjectUseCaseResponse } from './input-output/update-project.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class UpdateProjectUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(
    request: UpdateProjectUseCaseRequest
  ): Promise<ResultEx<UpdateProjectUseCaseResponse, ProjectNotFoundError | ProjectAccessDeniedError | InvalidProjectDataError>> {
    this._logger.info('update-project.start', { projectId: request.projectId, userId: request.userId });

    const findResult = await this._repository.findById(request.projectId);

    if (!findResult.isSuccess) {
      this._logger.error('update-project.not-found', { 
        projectId: request.projectId,
        userId: request.userId,
        error: findResult.error instanceof Error ? findResult.error.message : String(findResult.error),
        errorName: findResult.error?.name || 'Unknown'
      });
      return ResultEx.failure(findResult.error);
    }

    const existingProject = ProjectEntity.fromData(findResult.data);

    if (existingProject.userId !== request.userId) {
      this._logger.warn('update-project.access-denied', { projectId: request.projectId, userId: request.userId });
      return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
    }

    try {
      let updatedProject = existingProject;

      if (request.name !== undefined) {
        try {
          updatedProject = updatedProject.withName(request.name);
        } catch (error) {
          return ResultEx.failure(
            new InvalidProjectDataError(error instanceof Error ? error.message : 'Invalid project name')
          );
        }
      }

      if (request.status !== undefined) {
        updatedProject = updatedProject.withStatus(request.status);
      }

      if (request.segment !== undefined) {
        updatedProject = updatedProject.withSegment(request.segment);
      }

      if (request.hypothesis !== undefined) {
        updatedProject = updatedProject.withHypothesis(request.hypothesis);
      }

      if (request.marketContext !== undefined) {
        updatedProject = updatedProject.withMarketContext(request.marketContext);
      }

      if (request.targetAudience !== undefined) {
        updatedProject = updatedProject.withTargetAudience(request.targetAudience);
      }

      if (request.cost !== undefined) {
        updatedProject = updatedProject.withCost(request.cost);
      }

      const updateResult = await this._repository.update(updatedProject.toData());

      if (!updateResult.isSuccess) {
        this._logger.error('update-project.repository-error', { error: updateResult.error });
        return ResultEx.failure(updateResult.error);
      }

      this._logger.info('update-project.success', { projectId: updateResult.data.id });

      return ResultEx.success({
        project: updateResult.data,
      });
    } catch (error) {
      this._logger.error('update-project.error', { error });
      if (error instanceof InvalidProjectDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidProjectDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

