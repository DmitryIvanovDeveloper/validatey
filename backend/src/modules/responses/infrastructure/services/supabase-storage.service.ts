import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { StorageServicePort, UploadFileRequest, UploadFileResponse } from '../../application/ports/storage-service.port';

@injectable()
export class SupabaseStorageService implements StorageServicePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async uploadFile(request: UploadFileRequest): Promise<ResultEx<UploadFileResponse, Error>> {
    this._logger.info('supabase-storage-service.upload-file.start', { filename: request.filename });

    try {
      const supabase = getSupabaseClient();
      const path = request.folder ? `${request.folder}/${request.filename}` : request.filename;

      const { data, error } = await supabase.storage.from('responses').upload(path, request.file, {
        contentType: request.contentType,
        upsert: false,
      });

      if (error) {
        this._logger.error('supabase-storage-service.upload-file.error', { error });
        return ResultEx.failure(new Error(error.message));
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('responses').getPublicUrl(path);

      this._logger.info('supabase-storage-service.upload-file.success', { path, url: publicUrl });

      return ResultEx.success({
        url: publicUrl,
        path: data.path,
      });
    } catch (error) {
      this._logger.error('supabase-storage-service.upload-file.exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<ResultEx<string, Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.storage.from('responses').createSignedUrl(path, expiresIn);

      if (error) {
        this._logger.error('supabase-storage-service.get-signed-url.error', { error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data.signedUrl);
    } catch (error) {
      this._logger.error('supabase-storage-service.get-signed-url.exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async deleteFile(path: string): Promise<ResultEx<void, Error>> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.storage.from('responses').remove([path]);

      if (error) {
        this._logger.error('supabase-storage-service.delete-file.error', { error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-storage-service.delete-file.exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}


