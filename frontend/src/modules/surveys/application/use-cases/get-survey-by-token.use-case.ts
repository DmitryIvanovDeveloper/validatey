import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { SurveyRepositoryPort } from '../ports/survey-repository.port';
import type { QuestionOptions } from '../../domain/value-objects/survey-question.vo';
import { SurveyNotFoundError, SurveyExpiredError } from '../../domain/errors/survey.error';
import { InvalidTokenError } from '../../../invitations/domain/errors/invitation.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

export type GetSurveyByTokenUseCaseRequest = {
  token: string;
};

export type GetSurveyByTokenUseCaseResponse = {
  survey: {
    id: string;
    token: string;
    projectId: string;
    questions: Array<{
      id: string;
      type: string;
      text: string;
      required: boolean;
      options?: QuestionOptions;
    }>;
    status: string;
  };
  consentRequired?: boolean;
  consentText?: string;
  dataUsageText?: string;
  privacyPolicyUrl?: string | null;
  termsOfServiceUrl?: string | null;
  alreadyConsented?: boolean;
};

@injectable()
export class GetSurveyByTokenUseCase {
  constructor(
    @inject(TYPES.SurveyRepository)
    private readonly _surveyRepository: SurveyRepositoryPort
  ) {}

  async execute(input: GetSurveyByTokenUseCaseRequest): Promise<Result<GetSurveyByTokenUseCaseResponse, SurveyNotFoundError | SurveyExpiredError | InvalidTokenError>> {
    // Single request: survey repo GET /survey/:token returns survey + consent (invalid token → 404)
    const result = await this._surveyRepository.getByToken(input.token);
    if (!result.isSuccess) {
      return Result.failure(result.error);
    }

    const data = result.data;
    const survey = data.survey;

    return Result.success({
      survey: {
        id: survey.id,
        token: survey.token,
        projectId: survey.projectId,
        questions: survey.questions.map(q => ({
          id: q.id,
          type: q.type,
          text: q.text,
          required: q.required,
          options: q.options
        })),
        status: survey.status
      },
      consentRequired: data.consentRequired,
      consentText: data.consentText,
      dataUsageText: data.dataUsageText,
      privacyPolicyUrl: data.privacyPolicyUrl ?? null,
      termsOfServiceUrl: data.termsOfServiceUrl ?? null,
      alreadyConsented: data.alreadyConsented,
    });
  }
}

