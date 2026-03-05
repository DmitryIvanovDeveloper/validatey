import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectLandingEntity } from '../../domain/entities/project-landing.entity';
import { LandingUploadError, InvalidLandingArchiveError, UnsupportedFileTypeError, LandingQuotaExceededError } from '../../domain/errors/landing.error';
import type { ProjectLandingRepositoryPort } from '../ports/project-landing-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { UploadLandingUseCaseRequest, UploadLandingUseCaseResponse } from './input-output/upload-landing.io';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

@injectable()
export class UploadLandingUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectLandingRepository)
    private readonly _repository: ProjectLandingRepositoryPort
  ) {}

  async execute(
    request: UploadLandingUseCaseRequest
  ): Promise<ResultEx<UploadLandingUseCaseResponse, LandingUploadError | InvalidLandingArchiveError | UnsupportedFileTypeError | LandingQuotaExceededError>> {
    this._logger.info('upload-landing.start', {
      projectId: request.projectId,
      filename: request.file.name,
      size: request.file.size
    });

    try {
      // Validate file
      if (!request.file) {
        return ResultEx.failure(new InvalidLandingArchiveError('No file provided'));
      }

      // Check file size
      if (request.file.size > MAX_FILE_SIZE_BYTES) {
        return ResultEx.failure(new LandingQuotaExceededError(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`));
      }

      // Check file type (basic check)
      if (!request.file.name.toLowerCase().endsWith('.zip')) {
        return ResultEx.failure(new UnsupportedFileTypeError('Only ZIP archives are supported'));
      }

      // Upload file
      const result = await this._repository.upload({
        projectId: request.projectId,
        file: request.file,
      });

      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }

      const landing = result.data;

      this._logger.info('upload-landing.success', {
        landingId: landing.id,
        projectId: request.projectId,
        slug: landing.slug
      });

      return ResultEx.success({
        landing: landing.toData(),
      });
    } catch (error) {
      this._logger.error('upload-landing.error', { error, projectId: request.projectId });
      if (error instanceof LandingUploadError ||
          error instanceof InvalidLandingArchiveError ||
          error instanceof UnsupportedFileTypeError ||
          error instanceof LandingQuotaExceededError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new LandingUploadError(error instanceof Error ? error.message : 'Unknown error during landing upload'));
    }
  }
}