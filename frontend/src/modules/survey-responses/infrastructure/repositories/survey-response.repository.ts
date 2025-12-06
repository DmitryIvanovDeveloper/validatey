import { injectable, inject } from 'inversify';
import type { SurveyResponseRepositoryPort } from '../../application/ports/survey-response-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { SurveyResponse } from '../../domain/entities/survey-response.entity';
import { ResponseSaveError } from '../../domain/errors/survey-response.error';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class SurveyResponseRepository implements SurveyResponseRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async submitAnswer(token: string, questionId: string, value: string | number, audioUrl?: string): Promise<Result<SurveyResponse, ResponseSaveError>> {
    try {
      const response = await this._httpClient.post<{
        id: string;
        questionId: string;
        value: string | number;
        audioUrl: string | null;
        timestamp: string;
      }>(API_CONFIG.ENDPOINTS.SUBMIT_RESPONSE(token), {
        questionId,
        value,
        audioUrl
      });

      const surveyResponse = new SurveyResponse(
        response.id,
        response.questionId,
        response.value,
        response.audioUrl,
        new Date(response.timestamp)
      );

      return Result.success(surveyResponse);
    } catch (error) {
      return Result.failure(new ResponseSaveError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async submitSurvey(token: string): Promise<Result<void, ResponseSaveError>> {
    try {
      await this._httpClient.post(API_CONFIG.ENDPOINTS.SUBMIT_RESPONSE(token), {});
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(new ResponseSaveError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

