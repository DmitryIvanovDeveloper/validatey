import { injectable, inject } from 'inversify';
import type { SurveyRepositoryPort } from '../../application/ports/survey-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { Survey, SurveyStatus } from '../../domain/entities/survey.entity';
import { SurveyQuestion } from '../../domain/value-objects/survey-question.vo';
import { SurveyNotFoundError, SurveyExpiredError } from '../../domain/errors/survey.error';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class SurveyRepository implements SurveyRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async getByToken(token: string): Promise<Result<Survey, SurveyNotFoundError | SurveyExpiredError>> {
    try {
      const response = await this._httpClient.get<{
        id: string;
        token: string;
        projectId: string;
        questions: Array<{
          id: string;
          type: string;
          text: string;
          required: boolean;
        }>;
        status: string;
        startedAt: string | null;
        completedAt: string | null;
      }>(API_CONFIG.ENDPOINTS.SURVEY_BY_TOKEN(token));

      const questions = response.questions.map(q => new SurveyQuestion(
        q.id,
        q.type as any,
        q.text,
        q.required
      ));

      const survey = new Survey(
        response.id,
        response.token,
        response.projectId,
        questions,
        response.status as SurveyStatus,
        response.startedAt ? new Date(response.startedAt) : null,
        response.completedAt ? new Date(response.completedAt) : null
      );

      return Result.success(survey);
    } catch (error) {
      return Result.failure(new SurveyNotFoundError(token));
    }
  }
}

