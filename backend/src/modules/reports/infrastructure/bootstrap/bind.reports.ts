import { Container } from 'inversify';
import { TYPES } from './types';
import { ReportRepositoryPort } from '../../application/ports/report-repository.port';
import { SupabaseReportRepository } from '../repositories/supabase-report.repository';
import { PDFGeneratorPort } from '../../application/ports/pdf-generator.port';
import { PDFReportGeneratorService } from '../services/pdf-report-generator.service';
import { HTMLReportGeneratorService } from '../services/html-report-generator.service';
import { GenerateReportUseCase } from '../../application/use-cases/generate-report.use-case';
import { GetReportByTokenUseCase } from '../../application/use-cases/get-report-by-token.use-case';
import { ReportPresenter } from '../../interface-adapters/presenters/report.presenter';

export function bindReports(container: Container): void {
  // Repository
  container.bind<ReportRepositoryPort>(TYPES.ReportRepository).to(SupabaseReportRepository);

  // Services
  container.bind<PDFGeneratorPort>(TYPES.PDFGenerator).to(PDFReportGeneratorService);
  container.bind<HTMLReportGeneratorService>(TYPES.HTMLReportGenerator).to(HTMLReportGeneratorService);

  // Use Cases
  container.bind<GenerateReportUseCase>(TYPES.GenerateReportUseCase).to(GenerateReportUseCase);
  container.bind<GetReportByTokenUseCase>(TYPES.GetReportByTokenUseCase).to(GetReportByTokenUseCase);

  // Presenter
  container.bind<ReportPresenter>(TYPES.ReportPresenter).to(ReportPresenter);
}



