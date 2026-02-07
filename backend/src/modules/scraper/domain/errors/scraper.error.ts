export class ScraperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScraperError';
  }
}

export class InvalidScraperConfigError extends ScraperError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidScraperConfigError';
  }
}

/** Validation error with per-field messages for API responses. */
export class ScraperValidationError extends ScraperError {
  constructor(
    message: string,
    public readonly fields: Record<string, string>
  ) {
    super(message);
    this.name = 'ScraperValidationError';
  }
}

export class ScraperNotFoundError extends ScraperError {
  constructor(id: string) {
    super(`Scraper source not found: ${id}`);
    this.name = 'ScraperNotFoundError';
  }
}

export class ScraperRunFailedError extends ScraperError {
  constructor(message: string) {
    super(message);
    this.name = 'ScraperRunFailedError';
  }
}

export class ScraperBlockedError extends ScraperError {
  constructor(message: string) {
    super(message);
    this.name = 'ScraperBlockedError';
  }
}
