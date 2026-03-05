import Result from '../../../../infrastructure/result/result';
import { ProjectLanding } from '../../domain/entities/project-landing.entity';
import { LandingFile } from '../../domain/entities/landing-file.entity';
import { LandingNotFoundError, LandingAlreadyExistsError } from '../../domain/errors/landing.error';

export interface CreateProjectLandingData {
  projectId: string;
  slug: string;
  archiveFilename: string;
  fileCount: number;
  totalSizeBytes: number;
}

export interface CreateLandingFileData {
  landingId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  storagePath: string;
}

export interface ProjectLandingRepositoryPort {
  create(data: CreateProjectLandingData): Promise<Result<ProjectLanding, LandingAlreadyExistsError>>;
  findByProjectId(projectId: string): Promise<Result<ProjectLanding | null, never>>;
  findBySlug(slug: string): Promise<Result<ProjectLanding | null, never>>;
  deleteByProjectId(projectId: string): Promise<Result<void, LandingNotFoundError>>;
  getLandingFiles(landingId: string): Promise<Result<LandingFile[], LandingNotFoundError>>;
  saveLandingFile(data: CreateLandingFileData): Promise<Result<LandingFile, Error>>;
  deleteLandingFiles(landingId: string): Promise<Result<void, Error>>;
}