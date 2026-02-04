export const TYPES = {
  ReportRepository: Symbol.for('ReportRepository'),
  PDFGenerator: Symbol.for('PDFGenerator'),
  HTMLReportGenerator: Symbol.for('HTMLReportGenerator'),
  GenerateReportUseCase: Symbol.for('GenerateReportUseCase'),
  GetReportByTokenUseCase: Symbol.for('GetReportByTokenUseCase'),
  GetReportDataUseCase: Symbol.for('GetReportDataUseCase'),
  ReportPresenter: Symbol.for('ReportPresenter'),
} as const;



