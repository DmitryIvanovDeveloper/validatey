import Result from '../../../../infrastructure/result/result';
import { ProjectLandingEntity } from '../../domain/entities/project-landing.entity';
import { LandingNotFoundError, LandingUploadError } from '../../domain/errors/landing.error';

export interface UploadLandingData {
  projectId: string;
  file: File;
}

export interface GenerateLandingData {
  projectId: string;
  customPrompt?: string;
}

export interface ProjectLandingRepositoryPort {
  upload(data: UploadLandingData): Promise<Result<ProjectLandingEntity, LandingUploadError>>;
  generateWithAI(data: GenerateLandingData): Promise<Result<ProjectLandingEntity, LandingUploadError>>;
  getByProjectId(projectId: string): Promise<Result<ProjectLandingEntity | null, Error>>;
  deleteByProjectId(projectId: string): Promise<Result<void, LandingNotFoundError>>;
}