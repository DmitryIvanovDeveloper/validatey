export const TYPES = {
  ReportRepository: Symbol.for('ReportRepository'),
  PDFGenerator: Symbol.for('PDFGenerator'),
  HTMLReportGenerator: Symbol.for('HTMLReportGenerator'),
  GenerateReportUseCase: Symbol.for('GenerateReportUseCase'),
  GetReportByTokenUseCase: Symbol.for('GetReportByTokenUseCase'),
  GetReportDataUseCase: Symbol.for('GetReportDataUseCase'),
  ReportController: Symbol.for('ReportController'),
} as const;



