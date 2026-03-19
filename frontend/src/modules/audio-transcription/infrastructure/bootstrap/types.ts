export const TYPES = {
  AudioTranscriptionRepository: Symbol.for('AudioTranscriptionRepository'),
  TranscribeAudioUseCase: Symbol.for('AudioTranscription.TranscribeAudioUseCase'),
  ListTranscriptionsUseCase: Symbol.for('AudioTranscription.ListTranscriptionsUseCase'),
  DeleteTranscriptionUseCase: Symbol.for('AudioTranscription.DeleteTranscriptionUseCase'),
  GenerateTranscriptionInsightsUseCase: Symbol.for('AudioTranscription.GenerateTranscriptionInsightsUseCase'),
  GetTranscriptionInsightsUseCase: Symbol.for('AudioTranscription.GetTranscriptionInsightsUseCase'),
  AudioTranscriptionPresenter: Symbol.for('AudioTranscriptionPresenter'),
} as const;
