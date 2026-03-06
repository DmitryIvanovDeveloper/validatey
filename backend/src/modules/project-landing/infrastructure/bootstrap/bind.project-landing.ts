import { Container } from 'inversify';
import { TYPES } from './types';

// Domain Services
import { LandingSlugGeneratorService } from '../../domain/services/landing-slug-generator.service';
import { DefaultLandingSlugGeneratorService } from '../../domain/services/landing-slug-generator.service';

// Application
import { UploadLandingUseCase } from '../../application/use-cases/upload-landing.use-case';
import { GetProjectLandingUseCase } from '../../application/use-cases/get-project-landing.use-case';
import { DeleteLandingUseCase } from '../../application/use-cases/delete-landing.use-case';
import { ServeLandingFileUseCase } from '../../application/use-cases/serve-landing-file.use-case';
import { GenerateLandingUseCase } from '../../application/use-cases/generate-landing.use-case';
import { ProjectLandingRepositoryPort } from '../../application/ports/project-landing-repository.port';
import { LandingFileStoragePort } from '../../application/ports/landing-file-storage.port';
import { ArchiveExtractorPort } from '../../application/ports/archive-extractor.port';
import { LandingGenerationLLMPort } from '../../application/ports/landing-generation-llm.port';
import { ZipArchiveCreatorPort } from '../../application/ports/zip-archive-creator.port';

// Infrastructure
import { SupabaseProjectLandingRepository } from '../repositories/supabase-project-landing.repository';
import { LocalLandingFileStorageAdapter } from '../adapters/local-landing-file-storage.adapter';
import { ZipArchiveExtractorAdapter } from '../adapters/zip-archive-extractor.adapter';
import { LandingGenerationLLMAdapter } from '../adapters/landing-generation-llm.adapter';
import { ZipArchiveCreatorAdapter } from '../adapters/zip-archive-creator.adapter';

// Interface Adapters
import { ProjectLandingController } from '../../interface-adapters/controllers/project-landing.controller';
import { PublicLandingController } from '../../interface-adapters/controllers/public-landing.controller';

export function bindProjectLanding(container: Container): void {
  // Domain Services
  container.bind<LandingSlugGeneratorService>(TYPES.LandingSlugGenerator).to(DefaultLandingSlugGeneratorService);

  // Use Cases
  container.bind(TYPES.UploadLandingUseCase).to(UploadLandingUseCase);
  container.bind(TYPES.GetProjectLandingUseCase).to(GetProjectLandingUseCase);
  container.bind(TYPES.DeleteLandingUseCase).to(DeleteLandingUseCase);
  container.bind(TYPES.ServeLandingFileUseCase).to(ServeLandingFileUseCase);
  container.bind(TYPES.GenerateLandingUseCase).to(GenerateLandingUseCase);

  // Repositories
  container.bind<ProjectLandingRepositoryPort>(TYPES.ProjectLandingRepository).to(SupabaseProjectLandingRepository);

  // Ports
  container.bind<LandingGenerationLLMPort>(TYPES.LandingGenerationLLM).to(LandingGenerationLLMAdapter);
  container.bind<ZipArchiveCreatorPort>(TYPES.ZipArchiveCreator).to(ZipArchiveCreatorAdapter);

  // Adapters
  container.bind<LandingFileStoragePort>(TYPES.LandingFileStorage).to(LocalLandingFileStorageAdapter);
  container.bind<ArchiveExtractorPort>(TYPES.ArchiveExtractor).to(ZipArchiveExtractorAdapter);

  // Controllers
  container.bind(TYPES.ProjectLandingController).to(ProjectLandingController);
  container.bind(TYPES.PublicLandingController).to(PublicLandingController);
}