export class LandingNotFoundError extends Error {
  constructor(landingId: string) {
    super(`Project landing with id '${landingId}' not found`);
    this.name = 'LandingNotFoundError';
  }
}

export class LandingAlreadyExistsError extends Error {
  constructor(projectId: string) {
    super(`Project '${projectId}' already has a landing`);
    this.name = 'LandingAlreadyExistsError';
  }
}

export class InvalidLandingArchiveError extends Error {
  constructor(reason: string) {
    super(`Invalid landing archive: ${reason}`);
    this.name = 'InvalidLandingArchiveError';
  }
}

export class LandingFileNotFoundError extends Error {
  constructor(filename: string) {
    super(`Landing file '${filename}' not found`);
    this.name = 'LandingFileNotFoundError';
  }
}

export class UnsupportedFileTypeError extends Error {
  constructor(filename: string, contentType: string) {
    super(`Unsupported file type: ${filename} (${contentType})`);
    this.name = 'UnsupportedFileTypeError';
  }
}

export class LandingQuotaExceededError extends Error {
  constructor(maxSizeBytes: number) {
    super(`Landing size exceeds maximum allowed size of ${maxSizeBytes} bytes`);
    this.name = 'LandingQuotaExceededError';
  }
}