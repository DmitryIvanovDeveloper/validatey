import { Container } from 'inversify';
import { TYPES } from './types';
import { ResponseRepositoryPort } from '../../application/ports/response-repository.port';
import { SupabaseResponseRepository } from '../repositories/supabase-response.repository';
import { StorageServicePort } from '../../application/ports/storage-service.port';
import { SupabaseStorageService } from '../services/supabase-storage.service';
import { TranscriptionServicePort } from '../../application/ports/transcription-service.port';
import { TranscriptionService } from '../services/transcription.service';
import { EmbeddingServicePort } from '../../application/ports/embedding-service.port';
import { EmbeddingService } from '../services/embedding.service';
import { SubmitResponseUseCase } from '../../application/use-cases/submit-response.use-case';
import { ResponsePresenter } from '../../interface-adapters/presenters/response.presenter';

export function bindResponses(container: Container): void {
  // Repository
  container.bind<ResponseRepositoryPort>(TYPES.ResponseRepository).to(SupabaseResponseRepository);

  // Services
  container.bind<StorageServicePort>(TYPES.StorageService).to(SupabaseStorageService);
  container.bind<TranscriptionServicePort>(TYPES.TranscriptionService).to(TranscriptionService);
  container.bind<EmbeddingServicePort>(TYPES.EmbeddingService).to(EmbeddingService);

  // Use Cases
  container.bind<SubmitResponseUseCase>(TYPES.SubmitResponseUseCase).to(SubmitResponseUseCase);

  // Presenter
  container.bind<ResponsePresenter>(TYPES.ResponsePresenter).to(ResponsePresenter);
}

