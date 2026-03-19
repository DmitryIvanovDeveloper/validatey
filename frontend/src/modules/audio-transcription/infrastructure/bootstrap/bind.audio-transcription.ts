import { Container } from 'inversify';
import { TYPES } from './types';
import type { AudioTranscriptionRepositoryPort } from '../../application/ports/audio-transcription-repository.port';
import { HttpAudioTranscriptionRepository } from '../repositories/http-audio-transcription.repository';
import { AudioTranscriptionPresenter } from '../../interface-adapters/presenters/audio-transcription.presenter';
import { TranscribeAudioUseCase } from '../../application/use-cases/transcribe-audio.use-case';
import { ListTranscriptionsUseCase } from '../../application/use-cases/list-transcriptions.use-case';
import { DeleteTranscriptionUseCase } from '../../application/use-cases/delete-transcription.use-case';
import { GenerateTranscriptionInsightsUseCase } from '../../application/use-cases/generate-transcription-insights.use-case';
import { GetTranscriptionInsightsUseCase } from '../../application/use-cases/get-transcription-insights.use-case';

export function bindAudioTranscription(container: Container): void {
  container
    .bind<AudioTranscriptionRepositoryPort>(TYPES.AudioTranscriptionRepository)
    .to(HttpAudioTranscriptionRepository);
  container.bind<TranscribeAudioUseCase>(TYPES.TranscribeAudioUseCase).to(TranscribeAudioUseCase);
  container.bind<ListTranscriptionsUseCase>(TYPES.ListTranscriptionsUseCase).to(ListTranscriptionsUseCase);
  container.bind<DeleteTranscriptionUseCase>(TYPES.DeleteTranscriptionUseCase).to(DeleteTranscriptionUseCase);
  container
    .bind<GenerateTranscriptionInsightsUseCase>(TYPES.GenerateTranscriptionInsightsUseCase)
    .to(GenerateTranscriptionInsightsUseCase);
  container
    .bind<GetTranscriptionInsightsUseCase>(TYPES.GetTranscriptionInsightsUseCase)
    .to(GetTranscriptionInsightsUseCase);
  container.bind<AudioTranscriptionPresenter>(TYPES.AudioTranscriptionPresenter).to(AudioTranscriptionPresenter);
}
