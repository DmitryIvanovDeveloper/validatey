export const TYPES = {
  SpeechToTextPort: Symbol.for('ProjectTranscription.SpeechToTextPort'),
  TranscriptionInsightsLlmPort: Symbol.for('ProjectTranscription.TranscriptionInsightsLlmPort'),
  ProjectTranscriptionRepository: Symbol.for('ProjectTranscriptionRepository'),
  TranscribeProjectAudioUseCase: Symbol.for('TranscribeProjectAudioUseCase'),
  ListProjectTranscriptsUseCase: Symbol.for('ListProjectTranscriptsUseCase'),
  GetProjectTranscriptionInsightsUseCase: Symbol.for('GetProjectTranscriptionInsightsUseCase'),
  DeleteProjectTranscriptionUseCase: Symbol.for('DeleteProjectTranscriptionUseCase'),
  GenerateProjectTranscriptionInsightsUseCase: Symbol.for('GenerateProjectTranscriptionInsightsUseCase'),
  ProjectTranscriptionController: Symbol.for('ProjectTranscriptionController'),
} as const;
