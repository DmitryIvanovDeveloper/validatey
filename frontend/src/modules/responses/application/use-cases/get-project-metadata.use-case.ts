import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';

export interface ProjectMetadata {
  significanceTarget: number | null; // null if data unavailable
  deadline?: Date;
}

export interface GetProjectMetadataUseCaseRequest {
  projectId: string;
}

export interface GetProjectMetadataUseCaseResponse extends ProjectMetadata {}

@injectable()
export class GetProjectMetadataUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async execute(
    request: GetProjectMetadataUseCaseRequest
  ): Promise<ResultEx<GetProjectMetadataUseCaseResponse, Error>> {
    this._logger.info('get-project-metadata.start', { projectId: request.projectId });

    try {
      // Get project data from API
      const projectUrl = API_CONFIG.ENDPOINTS.PROJECT(request.projectId);
      const projectData = await this._httpClient.get<{
        scenarioTemplateSlug: string | null;
        deadline: string | null;
      }>(projectUrl);

      // Get significance target from scenario template
      let significanceTarget: number | null = null;
      if (projectData.scenarioTemplateSlug) {
        try {
          const templateUrl = `/scenarios/templates/${projectData.scenarioTemplateSlug}`;
          const templateData = await this._httpClient.get<{
            significanceTarget?: number;
          }>(templateUrl);
          significanceTarget = templateData.significanceTarget || null;
        } catch (templateError) {
          this._logger.warn('Failed to get significance target from template', {
            projectId: request.projectId,
            templateSlug: projectData.scenarioTemplateSlug,
            error: templateError
          });
          significanceTarget = null;
        }
      }

      const metadata: ProjectMetadata = {
        significanceTarget,
        deadline: projectData.deadline ? new Date(projectData.deadline) : undefined
      };

      this._logger.info('get-project-metadata.success', {
        projectId: request.projectId,
        significanceTarget: metadata.significanceTarget,
        hasDeadline: !!metadata.deadline
      });

      return ResultEx.success(metadata);
    } catch (error) {
      this._logger.error('get-project-metadata.error', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}