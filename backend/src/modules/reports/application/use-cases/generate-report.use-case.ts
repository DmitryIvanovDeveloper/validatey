import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ReportEntity } from '../../domain/entities/report.entity';
import { ReportToken } from '../../domain/value-objects/report-token.vo';
import { ReportGenerationError, InvalidReportDataError } from '../../domain/errors/report.error';
import { ReportRepositoryPort } from '../ports/report-repository.port';
import { PDFGeneratorPort } from '../ports/pdf-generator.port';
import { HTMLReportGeneratorService } from '../../infrastructure/services/html-report-generator.service';
import { GenerateReportUseCaseRequest, GenerateReportUseCaseResponse } from './input-output/generate-report.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { MetricsRepositoryPort } from '../../../metrics/application/ports/metrics-repository.port';
import { TYPES as METRICS_TYPES } from '../../../metrics/infrastructure/bootstrap/types';

@injectable()
export class GenerateReportUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ReportRepository)
    private readonly _repository: ReportRepositoryPort,
    @inject(TYPES.PDFGenerator)
    private readonly _pdfGenerator: PDFGeneratorPort,
    @inject(TYPES.HTMLReportGenerator)
    private readonly _htmlGenerator: HTMLReportGeneratorService,
    @inject(METRICS_TYPES.MetricsRepository)
    private readonly _metricsRepository: MetricsRepositoryPort
  ) {}

  async execute(
    request: GenerateReportUseCaseRequest
  ): Promise<ResultEx<GenerateReportUseCaseResponse, ReportGenerationError | InvalidReportDataError>> {
    this._logger.info('generate-report.start', { projectId: request.projectId });

    try {
      // Get latest version
      const versionResult = await this._repository.getLatestVersion(request.projectId);
      const nextVersion = versionResult.isSuccess ? versionResult.data + 1 : 1;

      // Get metrics data
      const metricsResult = await this._metricsRepository.getMetricsData(request.projectId);
      if (!metricsResult.isSuccess) {
        return ResultEx.failure(new ReportGenerationError('Failed to get metrics data'));
      }

      // Generate HTML report
      const htmlContent = await this._htmlGenerator.generateHTML(request.projectId, metricsResult.data);

      // Create report entity
      const token = ReportToken.generate();
      const report = ReportEntity.create(request.projectId, nextVersion, metricsResult.data as unknown as Record<string, unknown>, token.value)
        .withHtmlContent(htmlContent);

      // Generate PDF if requested
      let finalReport = report;
      if (request.includePDF) {
        const pdfResult = await this._pdfGenerator.generatePDF({
          htmlContent,
          filename: `report_${request.projectId}_v${nextVersion}.pdf`,
        });

        if (pdfResult.isSuccess) {
          finalReport = report.withPdfUrl(pdfResult.data.pdfUrl);
        } else {
          this._logger.warn('generate-report.pdf-generation-failed', { error: pdfResult.error });
        }
      }

      // Save report
      const saveResult = await this._repository.create(finalReport.toData());

      if (!saveResult.isSuccess) {
        this._logger.error('generate-report.save-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      this._logger.info('generate-report.success', { reportId: saveResult.data.id, version: nextVersion });

      return ResultEx.success({
        report: saveResult.data,
      });
    } catch (error) {
      this._logger.error('generate-report.error', { error });
      if (error instanceof ReportGenerationError || error instanceof InvalidReportDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(
        new ReportGenerationError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }
}



