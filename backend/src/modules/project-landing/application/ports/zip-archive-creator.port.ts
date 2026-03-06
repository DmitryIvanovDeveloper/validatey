import Result from '../../../../infrastructure/result/result';

export interface ArchiveFile {
  filename: string;
  content: string;
  contentType: string;
}

export interface ZipArchiveCreatorPort {
  createArchive(files: ArchiveFile[]): Promise<Result<Buffer, Error>>;
}