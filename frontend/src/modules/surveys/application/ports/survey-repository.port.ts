import Result from '../../../../infrastructure/result/result';
import { Survey } from '../../domain/entities/survey.entity';
import { SurveyNotFoundError, SurveyExpiredError } from '../../domain/errors/survey.error';

export interface SurveyRepositoryPort {
  getByToken(token: string): Promise<Result<Survey, SurveyNotFoundError | SurveyExpiredError>>;
}



