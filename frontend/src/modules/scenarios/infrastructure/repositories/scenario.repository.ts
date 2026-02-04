import { injectable, inject } from 'inversify';
import type { ScenarioRepositoryPort, MarketContextForScenario } from '../../application/ports/scenario-repository.port';
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
    marketContext?: MarketContextForScenario,
    prompt?: string
  ): Promise<Result<Scenario, ScenarioGenerationError>> {
    try {
      const url = `${API_CONFIG.ENDPOINTS.SCENARIOS(projectId)}/generate`;
      const requestData = {
        projectId,
        segment: segment ?? null,
        hypothesis: hypothesis ?? null,
        marketContext: marketContext ?? null,
        prompt: prompt ?? undefined,
      };

      console.log('📋 Scenario Generation Request:', {
        url: `${API_CONFIG.BASE_URL}${url}`,
        projectId,
        hasSegment: !!segment,
        hasHypothesis: !!hypothesis,
        hasMarketContext: !!marketContext,
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

      const createdAt =
        response.scenario.createdAt != null
          ? new Date(response.scenario.createdAt)
          : new Date();
      const content = (response.scenario.content ?? '').trim() || '(No content)';
      const scenario = new Scenario(
        response.scenario.id,
        response.scenario.projectId,
        content,
        response.scenario.version ?? 1,
        status,
        isNaN(createdAt.getTime()) ? new Date() : createdAt
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
        createdAt?: string | null;
      }>(API_CONFIG.ENDPOINTS.SCENARIO(projectId, scenarioId));

      const createdAt = response.createdAt != null ? new Date(response.createdAt) : new Date();
      const content = (response.content ?? '').trim() || '(No content)';
      const scenario = new Scenario(
        response.id,
        response.projectId,
        content,
        response.version,
        response.status as ScenarioStatus,
        isNaN(createdAt.getTime()) ? new Date() : createdAt
      );

      return Result.success(scenario);
    } catch (error) {
      return Result.failure(new ScenarioNotFoundError(scenarioId));
    }
  }

  async getLatestByProjectId(projectId: string): Promise<Result<Scenario, ScenarioNotFoundError>> {
    try {
      const response = await this._httpClient.get<{
        scenario: {
          id: string;
          projectId: string;
          content: string;
          version: number;
          isGenerated?: boolean;
          isEdited?: boolean;
          createdAt: string;
          updatedAt?: string;
        };
      }>(API_CONFIG.ENDPOINTS.SCENARIOS(projectId));

      const s = response.scenario;
      let status: ScenarioStatus = 'draft';
      if (s.isGenerated !== undefined || s.isEdited !== undefined) {
        status = s.isGenerated && !s.isEdited ? 'generated' : s.isGenerated && s.isEdited ? 'approved' : 'draft';
      }

      const scenario = new Scenario(
        s.id,
        s.projectId,
        s.content,
        s.version,
        status,
        new Date(s.createdAt)
      );

      return Result.success(scenario);
    } catch (error) {
      return Result.failure(
        new ScenarioNotFoundError(projectId, 'No scenario found for this project.')
      );
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
        createdAt?: string | null;
      }>(API_CONFIG.ENDPOINTS.SCENARIO(projectId, scenarioId), { content });

      const createdAt = response.createdAt != null ? new Date(response.createdAt) : new Date();
      const responseContent = (response.content ?? '').trim() || '(No content)';
      const scenario = new Scenario(
        response.id,
        response.projectId,
        responseContent,
        response.version,
        response.status as ScenarioStatus,
        isNaN(createdAt.getTime()) ? new Date() : createdAt
      );

      return Result.success(scenario);
    } catch (error) {
      return Result.failure(new ScenarioNotFoundError(scenarioId));
    }
  }

  async saveVersion(projectId: string, content: string): Promise<Result<Scenario, ScenarioNotFoundError>> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCENARIOS_SAVE_VERSION}`;
      const response = await this._httpClient.post<{
        scenario: {
          id: string;
          projectId: string;
          content: string;
          version: number;
          createdAt: string;
          updatedAt?: string;
        };
      }>(url, { projectId, content });

      const s = response.scenario;
      const createdAt = s.createdAt != null ? new Date(s.createdAt) : new Date();
      const scenario = new Scenario(
        s.id,
        s.projectId,
        (s.content ?? '').trim() || '(No content)',
        s.version,
        'approved',
        isNaN(createdAt.getTime()) ? new Date() : createdAt
      );

      return Result.success(scenario);
    } catch (error) {
      return Result.failure(new ScenarioNotFoundError(projectId, 'Failed to save scenario version'));
    }
  }

  async getTemplates(): Promise<Result<Array<{ slug: string; name: string; content: string }>, ScenarioNotFoundError>> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCENARIOS_TEMPLATES}`;
      const response = await this._httpClient.get<{ templates: Array<{ slug: string; name: string; content: string }> }>(url);
      const list = response.templates ?? [];
      return Result.success(list);
    } catch (error) {
      return Result.failure(new ScenarioNotFoundError('templates', 'Failed to load templates'));
    }
  }

  async rateScenario(projectId: string, scenarioId: string, rating: number): Promise<Result<{ id: string }, ScenarioNotFoundError>> {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SCENARIOS_RATE}`;
      const response = await this._httpClient.post<{ id: string }>(url, { projectId, scenarioId, rating });
      return Result.success({ id: response.id });
    } catch (error) {
      return Result.failure(new ScenarioNotFoundError(scenarioId, 'Failed to save rating'));
    }
  }
}

