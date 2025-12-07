import { injectable, inject } from 'inversify';
import type { ScenarioRepositoryPort } from '../../application/ports/scenario-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { Scenario, ScenarioStatus } from '../../domain/entities/scenario.entity';
import { ScenarioNotFoundError, ScenarioGenerationError } from '../../domain/errors/scenario.error';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class ScenarioRepository implements ScenarioRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async generateScenario(
    projectId: string,
    segment?: { description: string; demographics: Record<string, any> } | null,
    hypothesis?: { description: string; assumptions: string[] } | null,
    prompt?: string
  ): Promise<Result<Scenario, ScenarioGenerationError>> {
    try {
      const url = `${API_CONFIG.ENDPOINTS.SCENARIOS(projectId)}/generate`;
      const requestData = {
        projectId,
        segment: segment || null,
        hypothesis: hypothesis || null,
        prompt: prompt || undefined,
      };
      
      console.log('📋 Scenario Generation Request:', {
        url: `${API_CONFIG.BASE_URL}${url}`,
        projectId,
        hasSegment: !!segment,
        hasHypothesis: !!hypothesis,
        hasPrompt: !!prompt,
        data: requestData
      });
      
      const response = await this._httpClient.post<{
        scenario: {
          id: string;
          projectId: string;
          content: string;
          version: number;
          status?: string; // Опционально, может отсутствовать
          isGenerated?: boolean;
          isEdited?: boolean;
          createdAt: string;
        };
      }>(url, requestData);

      // Вычисляем status на основе isGenerated и isEdited, если не указан явно
      let status: ScenarioStatus = 'draft';
      if (response.scenario.status) {
        status = response.scenario.status as ScenarioStatus;
      } else if (response.scenario.isGenerated !== undefined || response.scenario.isEdited !== undefined) {
        // Вычисляем status из флагов
        if (response.scenario.isGenerated && !response.scenario.isEdited) {
          status = 'generated';
        } else if (response.scenario.isGenerated && response.scenario.isEdited) {
          status = 'approved';
        } else if (!response.scenario.isGenerated) {
          status = 'draft';
        }
      }

      const scenario = new Scenario(
        response.scenario.id,
        response.scenario.projectId,
        response.scenario.content,
        response.scenario.version,
        status,
        new Date(response.scenario.createdAt)
      );

      return Result.success(scenario);
    } catch (error) {
      return Result.failure(new ScenarioGenerationError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getById(projectId: string, scenarioId: string): Promise<Result<Scenario, ScenarioNotFoundError>> {
    try {
      const response = await this._httpClient.get<{
        id: string;
        projectId: string;
        content: string;
        version: number;
        status: string;
        createdAt: string;
      }>(API_CONFIG.ENDPOINTS.SCENARIO(projectId, scenarioId));

      const scenario = new Scenario(
        response.id,
        response.projectId,
        response.content,
        response.version,
        response.status as ScenarioStatus,
        new Date(response.createdAt)
      );

      return Result.success(scenario);
    } catch (error) {
      return Result.failure(new ScenarioNotFoundError(scenarioId));
    }
  }

  async update(projectId: string, scenarioId: string, content: string): Promise<Result<Scenario, ScenarioNotFoundError>> {
    try {
      const response = await this._httpClient.put<{
        id: string;
        projectId: string;
        content: string;
        version: number;
        status: string;
        createdAt: string;
      }>(API_CONFIG.ENDPOINTS.SCENARIO(projectId, scenarioId), { content });

      const scenario = new Scenario(
        response.id,
        response.projectId,
        response.content,
        response.version,
        response.status as ScenarioStatus,
        new Date(response.createdAt)
      );

      return Result.success(scenario);
    } catch (error) {
      return Result.failure(new ScenarioNotFoundError(scenarioId));
    }
  }
}

