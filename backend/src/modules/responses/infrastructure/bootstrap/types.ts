export const TYPES = {
  ResponseRepository: Symbol.for('ResponseRepository'),
  CaptchaVerification: Symbol.for('CaptchaVerification'),
  StorageService: Symbol.for('StorageService'),
  TranscriptionService: Symbol.for('TranscriptionService'),
  EmbeddingService: Symbol.for('EmbeddingService'),
  SubmitResponseUseCase: Symbol.for('SubmitResponseUseCase'),
  GetResponsesByProjectIdUseCase: Symbol.for('GetResponsesByProjectIdUseCase'),
  ExportResponsesUseCase: Symbol.for('ExportResponsesUseCase'),
  ListResponsesForModerationUseCase: Symbol.for('ListResponsesForModerationUseCase'),
  ModerateResponseUseCase: Symbol.for('ModerateResponseUseCase'),
  ResponsePresenter: Symbol.for('ResponsePresenter'),
} as const;



