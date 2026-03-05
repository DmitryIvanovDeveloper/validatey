import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { LandingNotFoundError } from '../../domain/errors/landing.error';
import type { ProjectLandingRepositoryPort } from '../ports/project-landing-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { DeleteLandingUseCaseRequest, DeleteLandingUseCaseResponse } from './input-output/delete-landing.io';

@injectable()
export class DeleteLandingUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectLandingRepository)
    private readonly _repository: ProjectLandingRepositoryPort
  ) {}

  async execute(
    request: DeleteLandingUseCaseRequest
  ): Promise<ResultEx<DeleteLandingUseCaseResponse, LandingNotFoundError>> {
    this._logger.info('delete-landing.start', { projectId: request.projectId });

    try {
      const result = await this._repository.deleteByProjectId(request.projectId);

      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }

      this._logger.info('delete-landing.success', { projectId: request.projectId });

      return ResultEx.success({ success: true });
    } catch (error) {
      this._logger.error('delete-landing.error', { error, projectId: request.projectId });
      if (error instanceof LandingNotFoundError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new LandingNotFoundError(`Failed to delete landing for project ${request.projectId}`));
    }
  }
}