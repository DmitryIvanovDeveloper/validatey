import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { FileMetadataVO } from '../../domain/value-objects/file-metadata.vo';
import { InvalidFileDataError, FileUploadError } from '../../domain/errors/storage.error';
import { StorageRepositoryPort } from '../ports/storage-repository.port';
import { StorageServicePort } from '../../../responses/application/ports/storage-service.port';
import { TYPES as RESPONSES_TYPES } from '../../../responses/infrastructure/bootstrap/types';
import { UploadFileUseCaseRequest, UploadFileUseCaseResponse } from './input-output/upload-file.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class UploadFileUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.StorageRepository)
    private readonly _repository: StorageRepositoryPort,
    @inject(RESPONSES_TYPES.StorageService)
    private readonly _storageService: StorageServicePort
  ) {}

  async execute(
    request: UploadFileUseCaseRequest
  ): Promise<ResultEx<UploadFileUseCaseResponse, InvalidFileDataError | FileUploadError>> {
    this._logger.info('upload-file.start', { filename: request.filename, contentType: request.contentType });

    try {
      if (!request.file || request.file.length === 0) {
        return ResultEx.failure(new InvalidFileDataError('File buffer is required'));
      }

      if (!request.filename || request.filename.trim().length === 0) {
        return ResultEx.failure(new InvalidFileDataError('Filename is required'));
      }

      // Upload to storage
      const uploadResult = await this._storageService.uploadFile({
        file: request.file,
        filename: request.filename,
        contentType: request.contentType,
        folder: request.folder,
      });

      if (!uploadResult.isSuccess) {
        this._logger.error('upload-file.storage-error', { error: uploadResult.error });
        return ResultEx.failure(new FileUploadError(uploadResult.error.message));
      }

      // Create metadata
      const metadata = FileMetadataVO.create(
        request.filename,
        request.contentType,
        request.file.length,
        uploadResult.data.path,
        uploadResult.data.url
      );

      // Save metadata
      const saveResult = await this._repository.saveMetadata(metadata.toData());

      if (!saveResult.isSuccess) {
        this._logger.error('upload-file.save-metadata-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      this._logger.info('upload-file.success', { filename: request.filename, path: uploadResult.data.path });

      return ResultEx.success({
        file: saveResult.data,
      });
    } catch (error) {
      this._logger.error('upload-file.error', { error });
      if (error instanceof InvalidFileDataError || error instanceof FileUploadError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new FileUploadError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}



