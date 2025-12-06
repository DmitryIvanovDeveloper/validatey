export const TYPES = {
  ReportRepository: Symbol.for('ReportRepository'),
  GetReportUseCase: Symbol.for('GetReportUseCase'),
  GenerateReportUseCase: Symbol.for('GenerateReportUseCase'),
  DownloadReportUseCase: Symbol.for('DownloadReportUseCase'),
  ReportPresenter: Symbol.for('ReportPresenter'),
  ReportViewerPresenter: Symbol.for('ReportViewerPresenter'),
} as const;

