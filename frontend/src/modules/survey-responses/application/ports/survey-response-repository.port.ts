import Result from '../../../../infrastructure/result/result';
import { SurveyResponse } from '../../domain/entities/survey-response.entity';
import { ResponseSaveError } from '../../domain/errors/survey-response.error';

export interface SurveyResponseRepositoryPort {
  submitAnswer(token: string, questionId: string, value: string | number, audioUrl?: string): Promise<Result<SurveyResponse, ResponseSaveError>>;
  submitSurvey(token: string): Promise<Result<void, ResponseSaveError>>;
}


