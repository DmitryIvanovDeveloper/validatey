import { injectable, inject } from 'inversify';
import type { ProjectRiskRepositoryPort } from '../../application/ports/project-risk-repository.port';
import type { ProjectRiskAssessment } from '../../domain/entities/project-risk.entity';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class ProjectRiskHttpRepository implements ProjectRiskRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async assessRisk(
    hypothesis: string,
    segment: string,
    assumptions: string[]
  ): Promise<ProjectRiskAssessment> {
    const response = await this._httpClient.post<ProjectRiskAssessment>(
      API_CONFIG.ENDPOINTS.PROJECTS_ASSESS_RISK,
      { hypothesis, segment, assumptions }
    );
    return response;
  }
}
