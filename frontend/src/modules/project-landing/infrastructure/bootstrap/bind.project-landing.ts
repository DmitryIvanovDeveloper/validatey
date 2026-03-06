import { Container } from 'inversify';
import { TYPES } from './types';

// Application
import { UploadLandingUseCase } from '../../application/use-cases/upload-landing.use-case';
import { GetProjectLandingUseCase } from '../../application/use-cases/get-project-landing.use-case';
import { DeleteLandingUseCase } from '../../application/use-cases/delete-landing.use-case';
import { GenerateLandingUseCase } from '../../application/use-cases/generate-landing.use-case';
import { ProjectLandingRepositoryPort } from '../../application/ports/project-landing-repository.port';

// Infrastructure
import { HttpProjectLandingRepository } from '../repositories/http-project-landing.repository';

// Interface Adapters
import { ProjectLandingPresenter } from '../../interface-adapters/presenters/project-landing.presenter';

export function bindProjectLanding(container: Container): void {
  // Repositories
  container.bind<ProjectLandingRepositoryPort>(TYPES.ProjectLandingRepository).to(HttpProjectLandingRepository);

  // Use Cases
  container.bind<UploadLandingUseCase>(TYPES.UploadLandingUseCase).to(UploadLandingUseCase);
  container.bind<GetProjectLandingUseCase>(TYPES.GetProjectLandingUseCase).to(GetProjectLandingUseCase);
  container.bind<DeleteLandingUseCase>(TYPES.DeleteLandingUseCase).to(DeleteLandingUseCase);
  container.bind<GenerateLandingUseCase>(TYPES.GenerateLandingUseCase).to(GenerateLandingUseCase);

  // Presenters
  container.bind<ProjectLandingPresenter>(TYPES.ProjectLandingPresenter).to(ProjectLandingPresenter);
}