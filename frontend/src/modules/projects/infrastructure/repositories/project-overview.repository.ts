import { injectable, inject } from 'inversify';
import type { ProjectOverviewRepositoryPort } from '../../application/ports/project-overview-repository.port';
import type { OverviewPayload } from '../../application/use-cases/input-output/get-project-overview.io';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { OverviewLoadError } from '../../domain/errors/project.error';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class ProjectOverviewRepository implements ProjectOverviewRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async getOverview(projectId: string): Promise<Result<OverviewPayload, OverviewLoadError>> {
    try {
      const url = API_CONFIG.ENDPOINTS.OVERVIEW(projectId);
      const data = await this._httpClient.get<OverviewPayload>(url);
      if (data == null) {
        return Result.failure(new OverviewLoadError('Overview response was empty'));
      }
      return Result.success(data as OverviewPayload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return Result.failure(new OverviewLoadError(message));
    }
  }
}
