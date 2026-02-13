import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ScenarioGenerationError } from '../../domain/errors/scenario.error';
import { LLMServicePort, GenerateScenarioRequest, GenerateScenarioResponse } from '../../application/ports/llm-service.port';
import { ScenarioMetadata } from '../../domain/entities/scenario.entity';

@injectable()
export class HttpLLMService implements LLMServicePort {
  private readonly llmServiceUrl: string;

  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {
    this.llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8080';
  }

  async generateScenario(
    request: GenerateScenarioRequest
  ): Promise<ResultEx<GenerateScenarioResponse, ScenarioGenerationError>> {
    this._logger.info('http-llm-service.generate-scenario.start', { projectId: request.projectId });

    try {
      const url = `${this.llmServiceUrl}/api/v1/scenarios/generate`;
      
      // Адаптируем данные для LLM сервиса
      let segment = null;
      if (request.segment) {
        // Преобразуем demographics из объекта в string
        const demographicsStr = typeof request.segment.demographics === 'string'
          ? request.segment.demographics
          : request.segment.demographics?.text || JSON.stringify(request.segment.demographics);
        
        segment = {
          description: request.segment.description,
          demographics: demographicsStr,
          behavior: '', // Пустое значение, если не указано
          jtbd: '', // Пустое значение, если не указано
        };
      }

      let hypothesis = null;
      if (request.hypothesis) {
        // Разделяем description на problem и solution (если возможно)
        const description = request.hypothesis.description;
        hypothesis = {
          description: description,
          problem: description.split(' то ')[0] || description, // Все до "то" - проблема
          solution: description.split(' то ')[1] || '', // Все после "то" - решение
          assumptions: request.hypothesis.assumptions || [],
        };
      }
      
      const payload = {
        projectId: request.projectId,
        segment: segment,
        hypothesis: hypothesis,
        templateSlug: request.templateSlug,
        significanceTarget: request.significanceTarget,
        metadata: request.metadata,
        prompt: request.prompt, // Include custom prompt if provided
      };

      const data = await this._httpClient.post<{ content: string; metadata?: ScenarioMetadata }>(url, payload);

      if (!data || !data.content) {
        this._logger.error('http-llm-service.generate-scenario.invalid-response', { data });
        return ResultEx.failure(new ScenarioGenerationError('Invalid response from LLM service: missing content'));
      }

      const metadata: ScenarioMetadata = data.metadata || {
        tone: request.metadata?.tone || 'professional',
        length: request.metadata?.length || 10,
        branches: [],
      };

      this._logger.info('http-llm-service.generate-scenario.success', { projectId: request.projectId });

      return ResultEx.success({
        content: data.content,
        metadata,
      });
    } catch (error) {
      this._logger.error('http-llm-service.generate-scenario.exception', { error });
      return ResultEx.failure(
        new ScenarioGenerationError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }
}

