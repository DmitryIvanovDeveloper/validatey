import ResultEx from '../../../../infrastructure/result/result';
import { Report } from '../../domain/entities/report.entity';
import { ReportNotFoundError, InvalidReportDataError } from '../../domain/errors/report.error';

export interface ReportRepositoryPort {
  create(report: Report): Promise<ResultEx<Report, InvalidReportDataError>>;
  findById(id: string): Promise<ResultEx<Report, ReportNotFoundError>>;
  findByToken(token: string): Promise<ResultEx<Report, ReportNotFoundError>>;
  findByProjectId(projectId: string): Promise<ResultEx<Report[], Error>>;
  update(report: Report): Promise<ResultEx<Report, ReportNotFoundError | InvalidReportDataError>>;
  getLatestVersion(projectId: string): Promise<ResultEx<number, Error>>;
}



