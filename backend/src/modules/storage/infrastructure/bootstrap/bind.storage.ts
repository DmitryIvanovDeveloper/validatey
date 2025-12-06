import { Container } from 'inversify';
import { TYPES } from './types';
import { StorageRepositoryPort } from '../../application/ports/storage-repository.port';
import { SupabaseStorageRepository } from '../repositories/supabase-storage.repository';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { StoragePresenter } from '../../interface-adapters/presenters/storage.presenter';

export function bindStorage(container: Container): void {
  // Repository
  container.bind<StorageRepositoryPort>(TYPES.StorageRepository).to(SupabaseStorageRepository);

  // Use Cases
  container.bind<UploadFileUseCase>(TYPES.UploadFileUseCase).to(UploadFileUseCase);

  // Presenter
  container.bind<StoragePresenter>(TYPES.StoragePresenter).to(StoragePresenter);
}

