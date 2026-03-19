import { Container } from 'inversify';
import { TYPES } from './types';
import type { SpeechToTextPort } from '../../application/ports/speech-to-text.port';
import type { ProjectTranscriptionRepositoryPort } from '../../application/ports/project-transcription-repository.port';
import { OpenAIWhisperAdapter } from '../adapters/openai-whisper.adapter';
import { GoogleSpeechToTextAdapter } from '../adapters/google-speech-to-text.adapter';
import { TranscriptionInsightsLlmAdapter } from '../adapters/transcription-insights-llm.adapter';
import { SupabaseProjectTranscriptionRepository } from '../repositories/supabase-project-transcription.repository';
import { TranscribeProjectAudioUseCase } from '../../application/use-cases/transcribe-project-audio.use-case';
import { ListProjectTranscriptsUseCase } from '../../application/use-cases/list-project-transcripts.use-case';
import { GetProjectTranscriptionInsightsUseCase } from '../../application/use-cases/get-project-transcription-insights.use-case';
import { DeleteProjectTranscriptionUseCase } from '../../application/use-cases/delete-project-transcription.use-case';
import { GenerateProjectTranscriptionInsightsUseCase } from '../../application/use-cases/generate-project-transcription-insights.use-case';
import { ProjectTranscriptionController } from '../../interface-adapters/controllers/project-transcription.controller';
import type { TranscriptionInsightsLlmPort } from '../../application/ports/transcription-insights-llm.port';

export function bindProjectTranscription(container: Container): void {
  const raw = (process.env.SPEECH_TO_TEXT_PROVIDER || 'openai').toLowerCase().trim();
  const hasGoogleCreds =
    Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim()) ||
    Boolean(process.env.GOOGLE_SPEECH_CREDENTIALS_JSON?.trim());
  const useGoogle =
    raw === 'google' || raw === 'gcp' || (raw === 'auto' && hasGoogleCreds);

  if (useGoogle) {
    container.bind<SpeechToTextPort>(TYPES.SpeechToTextPort).to(GoogleSpeechToTextAdapter);
  } else {
    container.bind<SpeechToTextPort>(TYPES.SpeechToTextPort).to(OpenAIWhisperAdapter);
  }
  container
    .bind<ProjectTranscriptionRepositoryPort>(TYPES.ProjectTranscriptionRepository)
    .to(SupabaseProjectTranscriptionRepository);
  container
    .bind<TranscriptionInsightsLlmPort>(TYPES.TranscriptionInsightsLlmPort)
    .to(TranscriptionInsightsLlmAdapter);

  container.bind(TYPES.TranscribeProjectAudioUseCase).to(TranscribeProjectAudioUseCase);
  container.bind(TYPES.ListProjectTranscriptsUseCase).to(ListProjectTranscriptsUseCase);
  container.bind(TYPES.GetProjectTranscriptionInsightsUseCase).to(GetProjectTranscriptionInsightsUseCase);
  container.bind(TYPES.DeleteProjectTranscriptionUseCase).to(DeleteProjectTranscriptionUseCase);
  container.bind(TYPES.GenerateProjectTranscriptionInsightsUseCase).to(GenerateProjectTranscriptionInsightsUseCase);
  container.bind(TYPES.ProjectTranscriptionController).to(ProjectTranscriptionController);
}
