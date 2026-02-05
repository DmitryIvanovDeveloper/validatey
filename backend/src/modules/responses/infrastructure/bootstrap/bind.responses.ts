import { Container } from 'inversify';
import { TYPES } from './types';
import { ResponseRepositoryPort } from '../../application/ports/response-repository.port';
import { CaptchaVerificationPort } from '../../application/ports/captcha-verification.port';
import { SupabaseResponseRepository } from '../repositories/supabase-response.repository';
import { CaptchaVerificationStubService } from '../services/captcha-verification-stub.service';
import { StorageServicePort } from '../../application/ports/storage-service.port';
import { SupabaseStorageService } from '../services/supabase-storage.service';
import { TranscriptionServicePort } from '../../application/ports/transcription-service.port';
import { TranscriptionService } from '../services/transcription.service';
import { EmbeddingServicePort } from '../../application/ports/embedding-service.port';
import { EmbeddingService } from '../services/embedding.service';
import { SubmitResponseUseCase } from '../../application/use-cases/submit-response.use-case';
import { GetResponsesByProjectIdUseCase } from '../../application/use-cases/get-responses-by-project-id.use-case';
import { ExportResponsesUseCase } from '../../application/use-cases/export-responses.use-case';
import { ListResponsesForModerationUseCase } from '../../application/use-cases/list-responses-for-moderation.use-case';
import { ModerateResponseUseCase } from '../../application/use-cases/moderate-response.use-case';
import { ResponsePresenter } from '../../interface-adapters/presenters/response.presenter';

export function bindResponses(container: Container): void {
  // Repository
  container.bind<ResponseRepositoryPort>(TYPES.ResponseRepository).to(SupabaseResponseRepository);

  // Services (CAPTCHA stub; replace with real adapter when needed)
  container.bind<CaptchaVerificationPort>(TYPES.CaptchaVerification).to(CaptchaVerificationStubService);

  // Services
  container.bind<StorageServicePort>(TYPES.StorageService).to(SupabaseStorageService);
  container.bind<TranscriptionServicePort>(TYPES.TranscriptionService).to(TranscriptionService);
  container.bind<EmbeddingServicePort>(TYPES.EmbeddingService).to(EmbeddingService);

  // Use Cases
  container.bind<SubmitResponseUseCase>(TYPES.SubmitResponseUseCase).to(SubmitResponseUseCase);
  container.bind<GetResponsesByProjectIdUseCase>(TYPES.GetResponsesByProjectIdUseCase).to(GetResponsesByProjectIdUseCase);
  container.bind<ExportResponsesUseCase>(TYPES.ExportResponsesUseCase).to(ExportResponsesUseCase);
  container.bind<ListResponsesForModerationUseCase>(TYPES.ListResponsesForModerationUseCase).to(ListResponsesForModerationUseCase);
  container.bind<ModerateResponseUseCase>(TYPES.ModerateResponseUseCase).to(ModerateResponseUseCase);

  // Presenter
  container.bind<ResponsePresenter>(TYPES.ResponsePresenter).to(ResponsePresenter);
}



