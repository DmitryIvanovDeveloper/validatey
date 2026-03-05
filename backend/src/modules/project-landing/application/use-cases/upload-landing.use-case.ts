import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectLandingEntity } from '../../domain/entities/project-landing.entity';
import { LandingFileEntity } from '../../domain/entities/landing-file.entity';
import { LandingSlug } from '../../domain/value-objects/landing-slug.vo';
import { FileContentType } from '../../domain/value-objects/file-content-type.vo';
import { LandingAlreadyExistsError, InvalidLandingArchiveError, LandingQuotaExceededError, UnsupportedFileTypeError } from '../../domain/errors/landing.error';
import { LandingSlugGeneratorService } from '../../domain/services/landing-slug-generator.service';
import { ProjectLandingRepositoryPort } from '../ports/project-landing-repository.port';
import { LandingFileStoragePort } from '../ports/landing-file-storage.port';
import { ArchiveExtractorPort } from '../ports/archive-extractor.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { UploadLandingUseCaseRequest, UploadLandingUseCaseResponse } from './input-output/upload-landing.io';

const MAX_LANDING_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const MAX_FILES_COUNT = 100;

@injectable()
export class UploadLandingUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectLandingRepository)
    private readonly _repository: ProjectLandingRepositoryPort,
    @inject(TYPES.LandingFileStorage)
    private readonly _fileStorage: LandingFileStoragePort,
    @inject(TYPES.ArchiveExtractor)
    private readonly _archiveExtractor: ArchiveExtractorPort,
    @inject(TYPES.LandingSlugGenerator)
    private readonly _slugGenerator: LandingSlugGeneratorService
  ) {}

  async execute(
    request: UploadLandingUseCaseRequest
  ): Promise<ResultEx<UploadLandingUseCaseResponse, LandingAlreadyExistsError | InvalidLandingArchiveError | LandingQuotaExceededError>> {
    this._logger.info('upload-landing.start', {
      projectId: request.projectId,
      archiveFilename: request.archiveFilename,
      archiveSize: request.archiveBuffer.length
    });

    try {
      // Check if project already has a landing
      const existingLanding = await this._repository.findByProjectId(request.projectId);
      if (!existingLanding.isSuccess) {
        return ResultEx.failure(existingLanding.error);
      }
      if (existingLanding.data) {
        return ResultEx.failure(new LandingAlreadyExistsError(request.projectId));
      }

      // Extract and validate archive
      const extractResult = await this._archiveExtractor.extractArchive(
        request.archiveBuffer,
        request.archiveFilename
      );
      if (!extractResult.isSuccess) {
        return ResultEx.failure(new InvalidLandingArchiveError(extractResult.error.message));
      }

      const files = extractResult.data;

      // Validate archive structure
      const structureValidation = this._archiveExtractor.validateArchiveStructure(files);
      if (!structureValidation.isSuccess) {
        return ResultEx.failure(new InvalidLandingArchiveError(structureValidation.error.message));
      }

      // Check limits
      if (files.length > MAX_FILES_COUNT) {
        return ResultEx.failure(new InvalidLandingArchiveError(`Too many files: ${files.length}, maximum allowed: ${MAX_FILES_COUNT}`));
      }

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      if (totalSize > MAX_LANDING_SIZE_BYTES) {
        return ResultEx.failure(new LandingQuotaExceededError(MAX_LANDING_SIZE_BYTES));
      }

      // Validate each file
      for (const file of files) {
        try {
          FileContentType.create(file.contentType);
        } catch (error) {
          return ResultEx.failure(new UnsupportedFileTypeError(file.filename, file.contentType));
        }
      }

      // Generate slug (we'll need project name for this - for now use a simple approach)
      const slug = LandingSlug.create(`project-${request.projectId.slice(0, 8)}`);

      // Create landing entity
      const landing = ProjectLandingEntity.create(
        request.projectId,
        slug.value,
        request.archiveFilename,
        files.length,
        totalSize
      );

      // Save landing to database
      const saveLandingResult = await this._repository.create({
        projectId: landing.projectId,
        slug: landing.slug,
        archiveFilename: landing.archiveFilename,
        fileCount: landing.fileCount,
        totalSizeBytes: landing.totalSizeBytes,
      });

      if (!saveLandingResult.isSuccess) {
        return ResultEx.failure(saveLandingResult.error);
      }

      // Update landing with database-generated id
      landing = saveLandingResult.data;

      // Save all files
      const savedFiles: string[] = [];
      try {
        for (const file of files) {
          // Save file to storage
          const saveResult = await this._fileStorage.saveFile(
            file.buffer,
            file.filename,
            file.contentType
          );

          if (!saveResult.isSuccess) {
            throw new Error(`Failed to save file ${file.filename}: ${saveResult.error.message}`);
          }

          // Save file metadata to database
          const landingFile = LandingFileEntity.create(
            landing.id,
            file.filename,
            file.contentType,
            file.size,
            saveResult.data.path
          );

          const saveMetadataResult = await this._repository.saveLandingFile({
            landingId: landingFile.landingId,
            filename: landingFile.filename,
            contentType: landingFile.contentType,
            sizeBytes: landingFile.sizeBytes,
            storagePath: landingFile.storagePath,
          });

          if (!saveMetadataResult.isSuccess) {
            throw new Error(`Failed to save metadata for ${file.filename}: ${saveMetadataResult.error.message}`);
          }

          savedFiles.push(saveResult.data.path);
        }
      } catch (error) {
        // Cleanup on failure
        await this._repository.deleteByProjectId(request.projectId).catch(cleanupError =>
          this._logger.warn('upload-landing.db-cleanup-failed', { error: cleanupError })
        );

        return ResultEx.failure(new InvalidLandingArchiveError(error instanceof Error ? error.message : 'Unknown error during file processing'));
      }

      this._logger.info('upload-landing.success', {
        landingId: landing.id,
        projectId: request.projectId,
        fileCount: files.length,
        totalSize
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
        }
      });
    } catch (error) {
      this._logger.error('upload-landing.error', { error, projectId: request.projectId });
      if (error instanceof LandingAlreadyExistsError ||
          error instanceof InvalidLandingArchiveError ||
          error instanceof LandingQuotaExceededError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidLandingArchiveError('Unexpected error during landing upload'));
    }
  }
}