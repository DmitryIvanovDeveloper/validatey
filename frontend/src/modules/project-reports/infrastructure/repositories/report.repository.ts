import { injectable, inject } from 'inversify';
import type { ReportRepositoryPort } from '../../application/ports/report-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { ProjectReport, Verdict } from '../../domain/entities/project-report.entity';
import { ReportNotFoundError, ReportGenerationError } from '../../domain/errors/project-report.error';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { userContextService } from '../../../../shared/services/user-context.service';

@injectable()
export class ReportRepository implements ReportRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async get(projectId: string): Promise<Result<ProjectReport, ReportNotFoundError>> {
    try {
      const response = await this._httpClient.get<any>(API_CONFIG.ENDPOINTS.REPORT(projectId));
      // TODO: Map response to ProjectReport entity
      return Result.failure(new ReportNotFoundError(projectId));
    } catch (error) {
      return Result.failure(new ReportNotFoundError(projectId));
    }
  }

  async generate(projectId: string): Promise<Result<ProjectReport, ReportGenerationError>> {
    try {
      const response = await this._httpClient.post<any>(API_CONFIG.ENDPOINTS.REPORT(projectId), {});
      // TODO: Map response to ProjectReport entity
      return Result.failure(new ReportGenerationError('Not implemented'));
    } catch (error) {
      return Result.failure(new ReportGenerationError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async downloadHtml(projectId: string): Promise<Result<Blob, ReportNotFoundError>> {
    try {
      const userId = userContextService.getOrCreateUserId();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORT_HTML(projectId)}`, {
        headers: {
          'x-user-id': userId,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      return Result.success(blob);
    } catch (error) {
      return Result.failure(new ReportNotFoundError(projectId));
    }
  }

  async downloadPdf(projectId: string): Promise<Result<Blob, ReportNotFoundError>> {
    try {
      const userId = userContextService.getOrCreateUserId();
      
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REPORT_PDF(projectId)}`, {
        headers: {
          'x-user-id': userId,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const blob = await response.blob();
      return Result.success(blob);
    } catch (error) {
      return Result.failure(new ReportNotFoundError(projectId));
    }
  }
}

