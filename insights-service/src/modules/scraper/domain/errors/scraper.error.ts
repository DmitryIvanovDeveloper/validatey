export class ScraperError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScraperError";
  }
}

export class InvalidScraperConfigError extends ScraperError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidScraperConfigError";
  }
}

export class ScraperValidationError extends ScraperError {
  constructor(
    message: string,
    public readonly fields: Record<string, string>,
  ) {
    super(message);
    this.name = "ScraperValidationError";
  }
}

export class ScraperNotFoundError extends ScraperError {
  constructor(id: string) {
    super(`Scraper source not found: ${id}`);
    this.name = "ScraperNotFoundError";
  }
}
