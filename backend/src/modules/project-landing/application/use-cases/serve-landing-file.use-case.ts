import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { LandingNotFoundError, LandingFileNotFoundError } from '../../domain/errors/landing.error';
import { ProjectLandingRepositoryPort } from '../ports/project-landing-repository.port';
import { LandingFileStoragePort } from '../ports/landing-file-storage.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ServeLandingFileUseCaseRequest, ServeLandingFileUseCaseResponse } from './input-output/serve-landing-file.io';

@injectable()
export class ServeLandingFileUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectLandingRepository)
    private readonly _repository: ProjectLandingRepositoryPort,
    @inject(TYPES.LandingFileStorage)
    private readonly _fileStorage: LandingFileStoragePort
  ) {}

  async execute(
    request: ServeLandingFileUseCaseRequest
  ): Promise<ResultEx<ServeLandingFileUseCaseResponse, LandingNotFoundError | LandingFileNotFoundError>> {
    this._logger.info('serve-landing-file.start', {
      slug: request.slug,
      filepath: request.filepath
    });

    try {
      // Find landing by slug
      const landingResult = await this._repository.findBySlug(request.slug);
      if (!landingResult.isSuccess) {
        return ResultEx.failure(landingResult.error);
      }

      const landing = landingResult.data;
      if (!landing) {
        return ResultEx.failure(new LandingNotFoundError(`landing with slug ${request.slug}`));
      }

      // Get all files for this landing
      const filesResult = await this._repository.getLandingFiles(landing.id);
      if (!filesResult.isSuccess) {
        return ResultEx.failure(filesResult.error);
      }

      // Find the requested file
      const file = filesResult.data.find(f => f.filename === request.filepath);
      if (!file) {
        return ResultEx.failure(new LandingFileNotFoundError(request.filepath));
      }

      // Get file content from storage
      const fileResult = await this._fileStorage.getFile(file.storagePath);
      if (!fileResult.isSuccess) {
        this._logger.error('serve-landing-file.storage-error', {
          error: fileResult.error,
          path: file.storagePath
        });
        return ResultEx.failure(new LandingFileNotFoundError(request.filepath));
      }

      this._logger.info('serve-landing-file.success', {
        slug: request.slug,
        filepath: request.filepath,
        contentType: file.contentType,
        size: file.sizeBytes
      });

      return ResultEx.success({
        buffer: fileResult.data,
        contentType: file.contentType,
        filename: file.filename,
      });
    } catch (error) {
      this._logger.error('serve-landing-file.error', {
        error,
        slug: request.slug,
        filepath: request.filepath
      });
      if (error instanceof LandingNotFoundError || error instanceof LandingFileNotFoundError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new LandingFileNotFoundError(request.filepath));
    }
  }
}