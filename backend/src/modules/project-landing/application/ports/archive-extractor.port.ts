import Result from '../../../../infrastructure/result/result';

export interface ArchiveFileInfo {
  filename: string;
  contentType: string;
  size: number;
  buffer: Buffer;
}

export interface ArchiveExtractorPort {
  extractArchive(archiveBuffer: Buffer, filename: string): Promise<Result<ArchiveFileInfo[], Error>>;
  validateArchiveStructure(files: ArchiveFileInfo[]): Result<void, Error>;
}