import { injectable, inject } from 'inversify';
import type { SurveyRepositoryPort, SurveyWithConsent } from '../../application/ports/survey-repository.port';
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
        invitation: {
          id: string;
          projectId: string;
          token: string;
          email: string | null;
          status: string;
          sentAt: string | null;
          respondedAt: string | null;
        };
        survey: {
          id: string;
          token: string;
          projectId: string;
          questions: Array<{
            id: string;
            type: string;
            text: string;
            required: boolean;
            options?: {
              min?: number;
              max?: number;
              label?: string;
              choices?: string[];
              multiple?: boolean;
            };
          }>;
          status: string;
          startedAt: string | null;
          completedAt: string | null;
        };
      }>(API_CONFIG.ENDPOINTS.SURVEY_BY_TOKEN(token));

      // Extract survey from response
      const surveyData = response.survey;

      const questions = surveyData.questions.map(q => 
        new SurveyQuestion(
          q.id,
          q.type as any,
          q.text,
          q.required,
          q.options
        )
      );

      const survey = new Survey(
        surveyData.id,
        surveyData.token,
        surveyData.projectId,
        questions,
        surveyData.status as SurveyStatus,
        surveyData.startedAt ? new Date(surveyData.startedAt) : null,
        surveyData.completedAt ? new Date(surveyData.completedAt) : null
      );

      const withConsent: SurveyWithConsent = {
        survey,
        consentRequired: (response as any).consentRequired ?? false,
        consentText: (response as any).consentText ?? '',
        dataUsageText: (response as any).dataUsageText ?? '',
        privacyPolicyUrl: (response as any).privacyPolicyUrl ?? null,
        termsOfServiceUrl: (response as any).termsOfServiceUrl ?? null,
        alreadyConsented: (response as any).alreadyConsented ?? false,
      };
      return Result.success(withConsent);
    } catch (error) {
      return Result.failure(new SurveyNotFoundError(token));
    }
  }

  async recordConsent(token: string, consentText?: string | null): Promise<Result<void, Error>> {
    try {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace('/api', '');
      await this._httpClient.post(`${baseUrl}/survey/${token}/consent`, { consentText: consentText ?? null });
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to record consent'));
    }
  }

  async submitResponse(token: string, answers: Record<string, any>): Promise<Result<void, Error>> {
    try {
      await this._httpClient.post(API_CONFIG.ENDPOINTS.SUBMIT_RESPONSE(token), {
        token,
        answers,
      });
      return Result.success(undefined);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit response';
      return Result.failure(new Error(errorMessage));
    }
  }
}

