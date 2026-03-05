export class LandingNotFoundError extends Error {
  constructor(message: string = 'Project landing not found') {
    super(message);
    this.name = 'LandingNotFoundError';
  }
}

export class LandingAlreadyExistsError extends Error {
  constructor(message: string = 'Project already has a landing') {
    super(message);
    this.name = 'LandingAlreadyExistsError';
  }
}

export class InvalidLandingArchiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidLandingArchiveError';
  }
}

export class UnsupportedFileTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedFileTypeError';
  }
}

export class LandingQuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LandingQuotaExceededError';
  }
}

export class LandingUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LandingUploadError';
  }
}