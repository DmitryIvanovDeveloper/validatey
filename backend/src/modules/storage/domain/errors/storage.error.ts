export class StorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class FileNotFoundError extends StorageError {
  constructor(path: string) {
    super(`File not found: ${path}`);
    this.name = 'FileNotFoundError';
  }
}

export class InvalidFileDataError extends StorageError {
  constructor(message: string) {
    super(`Invalid file data: ${message}`);
    this.name = 'InvalidFileDataError';
  }
}

export class FileUploadError extends StorageError {
  constructor(message: string) {
    super(`File upload failed: ${message}`);
    this.name = 'FileUploadError';
  }
}

