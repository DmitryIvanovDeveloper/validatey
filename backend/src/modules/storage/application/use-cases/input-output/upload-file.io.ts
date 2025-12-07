import { FileMetadata } from '../../../domain/value-objects/file-metadata.vo';

export type UploadFileUseCaseRequest = {
  file: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
};

export type UploadFileUseCaseResponse = {
  file: FileMetadata;
};


