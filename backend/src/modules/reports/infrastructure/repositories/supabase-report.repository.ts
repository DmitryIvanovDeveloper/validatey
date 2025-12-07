import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Report } from '../../domain/entities/report.entity';
import { ReportNotFoundError, InvalidReportDataError } from '../../domain/errors/report.error';
import { ReportRepositoryPort } from '../../application/ports/report-repository.port';

@injectable()
export class SupabaseReportRepository implements ReportRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(report: Report): Promise<ResultEx<Report, InvalidReportDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('reports')
        .insert({
          id: report.id,
          project_id: report.projectId,
          version: report.version,
          metrics: report.metrics,
          html_content: report.htmlContent,
          pdf_url: report.pdfUrl,
          token: report.token,
          generated_at: report.generatedAt.toISOString(),
          created_at: report.createdAt.toISOString(),
          updated_at: report.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-report-repository.create-error', { error });
        return ResultEx.failure(new InvalidReportDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-report-repository.create-exception', { error });
      return ResultEx.failure(
        new InvalidReportDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Report, ReportNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('reports').select('*').eq('id', id).single();

      if (error || !data) {
        this._logger.error('supabase-report-repository.find-by-id-error', { id, error });
        return ResultEx.failure(new ReportNotFoundError(id));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-report-repository.find-by-id-exception', { id, error });
      return ResultEx.failure(new ReportNotFoundError(id));
    }
  }

  async findByToken(token: string): Promise<ResultEx<Report, ReportNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('reports').select('*').eq('token', token).single();

      if (error || !data) {
        this._logger.error('supabase-report-repository.find-by-token-error', {
          token: token.substring(0, 10) + '...',
          error,
        });
        return ResultEx.failure(new ReportNotFoundError(token));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-report-repository.find-by-token-exception', {
        token: token.substring(0, 10) + '...',
        error,
      });
      return ResultEx.failure(new ReportNotFoundError(token));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<Report[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('project_id', projectId)
        .order('version', { ascending: false });

      if (error) {
        this._logger.error('supabase-report-repository.find-by-project-id-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data.map((item) => this.mapToDomain(item)));
    } catch (error) {
      this._logger.error('supabase-report-repository.find-by-project-id-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(report: Report): Promise<ResultEx<Report, ReportNotFoundError | InvalidReportDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('reports')
        .update({
          metrics: report.metrics,
          html_content: report.htmlContent,
          pdf_url: report.pdfUrl,
          updated_at: report.updatedAt.toISOString(),
        })
        .eq('id', report.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-report-repository.update-not-found', { id: report.id });
          return ResultEx.failure(new ReportNotFoundError(report.id));
        }
        this._logger.error('supabase-report-repository.update-error', { error });
        return ResultEx.failure(new InvalidReportDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-report-repository.update-exception', { error });
      return ResultEx.failure(
        new InvalidReportDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async getLatestVersion(projectId: string): Promise<ResultEx<number, Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('reports')
        .select('version')
        .eq('project_id', projectId)
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return ResultEx.success(0);
        }
        this._logger.error('supabase-report-repository.get-latest-version-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data.version || 0);
    } catch (error) {
      this._logger.error('supabase-report-repository.get-latest-version-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private mapToDomain(data: any): Report {
    return {
      id: data.id,
      projectId: data.project_id,
      version: data.version,
      metrics: data.metrics,
      htmlContent: data.html_content,
      pdfUrl: data.pdf_url,
      token: data.token,
      generatedAt: new Date(data.generated_at),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}


