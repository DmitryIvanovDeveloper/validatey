import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { FileMetadata } from '../../domain/value-objects/file-metadata.vo';
import { FileNotFoundError, InvalidFileDataError } from '../../domain/errors/storage.error';
import { StorageRepositoryPort } from '../../application/ports/storage-repository.port';

@injectable()
export class SupabaseStorageRepository implements StorageRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async saveMetadata(metadata: FileMetadata): Promise<ResultEx<FileMetadata, InvalidFileDataError>> {
    // TODO: Create a file_metadata table if needed
    // For now, metadata is stored in Supabase Storage itself
    this._logger.info('supabase-storage-repository.save-metadata', {
      filename: metadata.filename,
      path: metadata.path,
    });
    return ResultEx.success(metadata);
  }

  async findMetadataByPath(path: string): Promise<ResultEx<FileMetadata, FileNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      // Check if file exists in storage
      const { data, error } = await supabase.storage.from('responses').list(path.split('/')[0] || '', {
        search: path.split('/').pop() || '',
      });

      if (error || !data || data.length === 0) {
        this._logger.error('supabase-storage-repository.find-by-path-error', { path, error });
        return ResultEx.failure(new FileNotFoundError(path));
      }

      // TODO: Return actual metadata from file
      const file = data[0];
      const metadata: FileMetadata = {
        filename: file.name,
        contentType: file.metadata?.mimetype || 'application/octet-stream',
        size: file.metadata?.size || 0,
        path,
        url: '', // Will be generated
        uploadedAt: new Date(file.created_at),
      };

      return ResultEx.success(metadata);
    } catch (error) {
      this._logger.error('supabase-storage-repository.find-by-path-exception', { path, error });
      return ResultEx.failure(new FileNotFoundError(path));
    }
  }

  async deleteMetadata(path: string): Promise<ResultEx<void, FileNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.storage.from('responses').remove([path]);

      if (error) {
        this._logger.error('supabase-storage-repository.delete-error', { path, error });
        return ResultEx.failure(new FileNotFoundError(path));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-storage-repository.delete-exception', { path, error });
      return ResultEx.failure(new FileNotFoundError(path));
    }
  }
}


