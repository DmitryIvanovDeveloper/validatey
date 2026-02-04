import Result from '../../../../infrastructure/result/result';
import { ProjectReport } from '../../domain/entities/project-report.entity';
import { ReportNotFoundError, ReportGenerationError } from '../../domain/errors/project-report.error';

/** Report view data returned by GET /projects/:id/report (live metrics). */
export interface ReportViewData {
  verdict: string;
  verdictType: 'positive' | 'negative' | 'neutral';
  metrics: Record<string, unknown>;
  clusters: Record<string, { size: number; [key: string]: unknown }>;
  alternatives: string[];
  wtp: number;
  recommendations: string[];
}

export interface ReportRepositoryPort {
  get(projectId: string): Promise<Result<ReportViewData, ReportNotFoundError>>;
  generate(projectId: string): Promise<Result<ProjectReport, ReportGenerationError>>;
  downloadHtml(projectId: string): Promise<Result<Blob, ReportNotFoundError>>;
  downloadPdf(projectId: string): Promise<Result<Blob, ReportNotFoundError>>;
}



