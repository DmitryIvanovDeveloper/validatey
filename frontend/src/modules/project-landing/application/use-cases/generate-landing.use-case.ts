import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectLandingRepositoryPort, GenerateLandingData } from '../ports/project-landing-repository.port';
import Result from '../../../../infrastructure/result/result';
import { ProjectLandingEntity } from '../../domain/entities/project-landing.entity';
import { LandingUploadError } from '../../domain/errors/landing.error';

@injectable()
export class GenerateLandingUseCase {
  constructor(
    @inject(TYPES.ProjectLandingRepository)
    private readonly _repository: ProjectLandingRepositoryPort
  ) {}

  async execute(data: GenerateLandingData): Promise<Result<ProjectLandingEntity, LandingUploadError>> {
    return this._repository.generateWithAI(data);
  }
}