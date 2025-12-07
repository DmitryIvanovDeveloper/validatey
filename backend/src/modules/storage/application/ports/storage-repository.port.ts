import ResultEx from '../../../../infrastructure/result/result';
import { FileMetadata } from '../../domain/value-objects/file-metadata.vo';
import { FileNotFoundError, InvalidFileDataError } from '../../domain/errors/storage.error';

export interface StorageRepositoryPort {
  saveMetadata(metadata: FileMetadata): Promise<ResultEx<FileMetadata, InvalidFileDataError>>;
  findMetadataByPath(path: string): Promise<ResultEx<FileMetadata, FileNotFoundError>>;
  deleteMetadata(path: string): Promise<ResultEx<void, FileNotFoundError>>;
}


