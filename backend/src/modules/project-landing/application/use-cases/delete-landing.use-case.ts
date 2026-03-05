import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { LandingNotFoundError } from '../../domain/errors/landing.error';
import { ProjectLandingRepositoryPort } from '../ports/project-landing-repository.port';
import { LandingFileStoragePort } from '../ports/landing-file-storage.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { DeleteLandingUseCaseRequest, DeleteLandingUseCaseResponse } from './input-output/delete-landing.io';

@injectable()
export class DeleteLandingUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectLandingRepository)
    private readonly _repository: ProjectLandingRepositoryPort,
    @inject(TYPES.LandingFileStorage)
    private readonly _fileStorage: LandingFileStoragePort
  ) {}

  async execute(
    request: DeleteLandingUseCaseRequest
  ): Promise<ResultEx<DeleteLandingUseCaseResponse, LandingNotFoundError>> {
    this._logger.info('delete-landing.start', { projectId: request.projectId });

    try {
      // Get landing info
      const landingResult = await this._repository.findByProjectId(request.projectId);
      if (!landingResult.isSuccess) {
        return ResultEx.failure(landingResult.error);
      }

      const landing = landingResult.data;
      if (!landing) {
        return ResultEx.failure(new LandingNotFoundError(`landing for project ${request.projectId}`));
      }

      // Get all files for this landing
      const filesResult = await this._repository.getLandingFiles(landing.id);
      if (!filesResult.isSuccess) {
        return ResultEx.failure(filesResult.error);
      }

      const files = filesResult.data;
      const filePaths = files.map(file => file.storagePath);

      // Delete files from storage
      if (filePaths.length > 0) {
        const deleteFilesResult = await this._fileStorage.deleteFiles(filePaths);
        if (!deleteFilesResult.isSuccess) {
          this._logger.warn('delete-landing.files-delete-failed', {
            error: deleteFilesResult.error,
            landingId: landing.id
          });
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete file metadata from database
      await this._repository.deleteLandingFiles(landing.id).catch(error =>
        this._logger.warn('delete-landing.metadata-delete-failed', { error, landingId: landing.id })
      );

      // Delete landing from database
      const deleteResult = await this._repository.deleteByProjectId(request.projectId);
      if (!deleteResult.isSuccess) {
        return ResultEx.failure(deleteResult.error);
      }

      this._logger.info('delete-landing.success', {
        landingId: landing.id,
        projectId: request.projectId,
        filesDeleted: filePaths.length
      });

      return ResultEx.success({ success: true });
    } catch (error) {
      this._logger.error('delete-landing.error', { error, projectId: request.projectId });
      if (error instanceof LandingNotFoundError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new LandingNotFoundError(`landing for project ${request.projectId}`));
    }
  }
}