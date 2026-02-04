import Result from '../../../../infrastructure/result/result';
import { Survey } from '../../domain/entities/survey.entity';
import { SurveyNotFoundError, SurveyExpiredError } from '../../domain/errors/survey.error';

export type SurveyWithConsent = {
  survey: Survey;
  consentRequired: boolean;
  consentText: string;
  dataUsageText: string;
  alreadyConsented: boolean;
};

export interface SurveyRepositoryPort {
  getByToken(token: string): Promise<Result<SurveyWithConsent, SurveyNotFoundError | SurveyExpiredError>>;
  recordConsent(token: string, consentText?: string | null): Promise<Result<void, Error>>;
  submitResponse(token: string, answers: Record<string, any>): Promise<Result<void, Error>>;
}



