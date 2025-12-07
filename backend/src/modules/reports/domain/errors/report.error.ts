export class ReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportError';
  }
}

export class ReportNotFoundError extends ReportError {
  constructor(reportId: string) {
    super(`Report with id ${reportId} not found`);
    this.name = 'ReportNotFoundError';
  }
}

export class InvalidReportDataError extends ReportError {
  constructor(message: string) {
    super(`Invalid report data: ${message}`);
    this.name = 'InvalidReportDataError';
  }
}

export class ReportGenerationError extends ReportError {
  constructor(message: string) {
    super(`Failed to generate report: ${message}`);
    this.name = 'ReportGenerationError';
  }
}


