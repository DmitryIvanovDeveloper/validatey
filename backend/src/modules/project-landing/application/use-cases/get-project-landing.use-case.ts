import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectLandingRepositoryPort } from '../ports/project-landing-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetProjectLandingUseCaseRequest, GetProjectLandingUseCaseResponse } from './input-output/get-project-landing.io';

@injectable()
export class GetProjectLandingUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectLandingRepository)
    private readonly _repository: ProjectLandingRepositoryPort
  ) {}

  async execute(
    request: GetProjectLandingUseCaseRequest
  ): Promise<ResultEx<GetProjectLandingUseCaseResponse, never>> {
    this._logger.info('get-project-landing.start', { projectId: request.projectId });

    try {
      const result = await this._repository.findByProjectId(request.projectId);

      if (!result.isSuccess) {
        this._logger.error('get-project-landing.repo-error', { error: result.error, projectId: request.projectId });
        return ResultEx.success({ landing: null }); // Return null instead of error for not found
      }

      const landing = result.data;

      if (!landing) {
        this._logger.info('get-project-landing.not-found', { projectId: request.projectId });
        return ResultEx.success({ landing: null });
      }

      this._logger.info('get-project-landing.success', {
        landingId: landing.id,
        projectId: request.projectId
      });

      return ResultEx.success({
        landing: {
          id: landing.id,
          projectId: landing.projectId,
          slug: landing.slug,
          archiveFilename: landing.archiveFilename,
          uploadedAt: landing.uploadedAt.toISOString(),
          fileCount: landing.fileCount,
          totalSizeBytes: landing.totalSizeBytes,
          url: `https://${landing.slug}.validatey.com`,
        }
      });
    } catch (error) {
      this._logger.error('get-project-landing.error', { error, projectId: request.projectId });
      return ResultEx.success({ landing: null }); // Return null on error to avoid breaking UI
    }
  }
}