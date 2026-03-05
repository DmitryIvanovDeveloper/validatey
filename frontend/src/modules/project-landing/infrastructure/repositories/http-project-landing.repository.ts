import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { ProjectLandingEntity } from '../../domain/entities/project-landing.entity';
import { LandingUploadError, LandingNotFoundError } from '../../domain/errors/landing.error';
import type { ProjectLandingRepositoryPort, UploadLandingData } from '../../application/ports/project-landing-repository.port';

@injectable()
export class HttpProjectLandingRepository implements ProjectLandingRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async upload(data: UploadLandingData): Promise<Result<ProjectLandingEntity, LandingUploadError>> {
    try {
      const formData = new FormData();
      formData.append('archive', data.file);

      const response = await this._httpClient.post<{
        landing: {
          id: string;
          projectId: string;
          slug: string;
          archiveFilename: string;
          uploadedAt: string;
          fileCount: number;
          totalSizeBytes: number;
          url: string;
        };
      }>(
        `${API_CONFIG.ENDPOINTS.PROJECT_LANDINGS}/${data.projectId}/upload`,
        formData
      );

      const landing = ProjectLandingEntity.fromApiResponse(response.landing);
      return Result.success(landing);
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Upload failed';
      return Result.failure(new LandingUploadError(message));
    }
  }

  async getByProjectId(projectId: string): Promise<Result<ProjectLandingEntity | null, Error>> {
    try {
      const response = await this._httpClient.get<{
        landing: {
          id: string;
          projectId: string;
          slug: string;
          archiveFilename: string;
          uploadedAt: string;
          fileCount: number;
          totalSizeBytes: number;
          url: string;
        } | null;
      }>(
        `${API_CONFIG.ENDPOINTS.PROJECT_LANDINGS}/${projectId}`
      );

      if (!response.landing) {
        return Result.success(null);
      }

      const landing = ProjectLandingEntity.fromApiResponse(response.landing);
      return Result.success(landing);
    } catch (error: any) {
      return Result.failure(new Error(error.response?.data?.error || error.message || 'Failed to get landing'));
    }
  }

  async deleteByProjectId(projectId: string): Promise<Result<void, LandingNotFoundError>> {
    try {
      await this._httpClient.delete(
        `${API_CONFIG.ENDPOINTS.PROJECT_LANDINGS}/${projectId}`
      );

      return Result.success(undefined);
    } catch (error: any) {
      if (error.response?.status === 404) {
        return Result.failure(new LandingNotFoundError());
      }
      return Result.failure(new LandingNotFoundError(error.message));
    }
  }
}