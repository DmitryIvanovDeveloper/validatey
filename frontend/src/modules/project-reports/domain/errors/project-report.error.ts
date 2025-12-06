export abstract class ProjectReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectReportError';
  }
}

export class ReportNotFoundError extends ProjectReportError {
  constructor(reportId: string) {
    super(`Report with id ${reportId} not found`);
    this.name = 'ReportNotFoundError';
  }
}

export class ReportGenerationError extends ProjectReportError {
  constructor(message: string) {
    super(`Report generation failed: ${message}`);
    this.name = 'ReportGenerationError';
  }
}

