export const TYPES = {
  ResponseRepository: Symbol.for('ResponseRepository'),
  StorageService: Symbol.for('StorageService'),
  TranscriptionService: Symbol.for('TranscriptionService'),
  EmbeddingService: Symbol.for('EmbeddingService'),
  SubmitResponseUseCase: Symbol.for('SubmitResponseUseCase'),
  GetResponsesByProjectIdUseCase: Symbol.for('GetResponsesByProjectIdUseCase'),
  ResponsePresenter: Symbol.for('ResponsePresenter'),
} as const;



