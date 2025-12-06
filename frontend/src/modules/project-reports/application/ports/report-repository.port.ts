import Result from '../../../../infrastructure/result/result';
import { ProjectReport } from '../../domain/entities/project-report.entity';
import { ReportNotFoundError, ReportGenerationError } from '../../domain/errors/project-report.error';

export interface ReportRepositoryPort {
  get(projectId: string): Promise<Result<ProjectReport, ReportNotFoundError>>;
  generate(projectId: string): Promise<Result<ProjectReport, ReportGenerationError>>;
  downloadHtml(projectId: string): Promise<Result<Blob, ReportNotFoundError>>;
  downloadPdf(projectId: string): Promise<Result<Blob, ReportNotFoundError>>;
}

