import ResultEx from '../../../../infrastructure/result/result';

export interface UploadFileRequest {
  file: Buffer;
  filename: string;
  contentType: string;
  folder?: string;
}

export interface UploadFileResponse {
  url: string;
  path: string;
}

export interface StorageServicePort {
  uploadFile(request: UploadFileRequest): Promise<ResultEx<UploadFileResponse, Error>>;
  getSignedUrl(path: string, expiresIn?: number): Promise<ResultEx<string, Error>>;
  deleteFile(path: string): Promise<ResultEx<void, Error>>;
}

