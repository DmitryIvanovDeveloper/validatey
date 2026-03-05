import Result from '../../../../infrastructure/result/result';

export interface LandingFileStoragePort {
  saveFile(fileBuffer: Buffer, filename: string, contentType: string): Promise<Result<{
    path: string;
    url: string;
  }, Error>>;

  getFile(path: string): Promise<Result<Buffer, Error>>;

  deleteFile(path: string): Promise<Result<void, Error>>;

  deleteFiles(paths: string[]): Promise<Result<void, Error>>;
}