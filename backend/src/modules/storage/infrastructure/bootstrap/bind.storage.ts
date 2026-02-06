import { Container } from 'inversify';
import { TYPES } from './types';
import { StorageRepositoryPort } from '../../application/ports/storage-repository.port';
import { SupabaseStorageRepository } from '../repositories/supabase-storage.repository';
import { UploadFileUseCase } from '../../application/use-cases/upload-file.use-case';
import { StorageController } from '../../interface-adapters/controllers/storage.controller';

export function bindStorage(container: Container): void {
  // Repository
  container.bind<StorageRepositoryPort>(TYPES.StorageRepository).to(SupabaseStorageRepository);

  // Use Cases
  container.bind<UploadFileUseCase>(TYPES.UploadFileUseCase).to(UploadFileUseCase);

  // Controller
  container.bind<StorageController>(TYPES.StorageController).to(StorageController);
}



