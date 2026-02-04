import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { SurveyRepositoryPort } from '../ports/survey-repository.port';
import type { InvitationServicePort } from '../../../invitations/application/services/invitation-service.port';
import { SurveyNotFoundError, SurveyExpiredError } from '../../domain/errors/survey.error';
import { InvalidTokenError } from '../../../invitations/domain/errors/invitation.error';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';

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
    }>;
    status: string;
  };
};

@injectable()
export class GetSurveyByTokenUseCase {
  constructor(
    @inject(TYPES.SurveyRepository)
    private readonly _surveyRepository: SurveyRepositoryPort,
    @inject(INVITATION_TYPES.InvitationService)
    private readonly _invitationService: InvitationServicePort
  ) {}

  async execute(input: GetSurveyByTokenUseCaseRequest): Promise<Result<GetSurveyByTokenUseCaseResponse, SurveyNotFoundError | SurveyExpiredError | InvalidTokenError>> {
    // Валидация токена через InvitationServicePort
    const tokenValidation = await this._invitationService.validateToken(input.token);
    if (!tokenValidation.isSuccess) {
      return Result.failure(tokenValidation.error);
    }

    // Получение опроса
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
      alreadyConsented: data.alreadyConsented,
    });
  }
}

