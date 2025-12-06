import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { GetSurveyByTokenUseCaseRequest, GetSurveyByTokenUseCaseResponse } from './input-output/get-survey-by-token.io';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import { GetInvitationByTokenUseCase } from '../../../invitations/application/use-cases/get-invitation-by-token.use-case';
import { SurveyNotFoundError } from '../../domain/errors/survey.error';

@injectable()
export class GetSurveyByTokenUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(INVITATION_TYPES.GetInvitationByTokenUseCase)
    private readonly _getInvitationByTokenUseCase: GetInvitationByTokenUseCase
  ) {}

  async execute(
    request: GetSurveyByTokenUseCaseRequest
  ): Promise<ResultEx<GetSurveyByTokenUseCaseResponse, SurveyNotFoundError>> {
    this._logger.info('get-survey-by-token.start', { token: request.token });

    // Get invitation by token
    const invitationResult = await this._getInvitationByTokenUseCase.execute({ token: request.token });

    if (!invitationResult.isSuccess) {
      this._logger.warn('get-survey-by-token.invitation-not-found', { token: request.token });
      return ResultEx.failure(new SurveyNotFoundError(`Survey not found for token: ${request.token}`));
    }

    const invitation = invitationResult.data.invitation;

    // TODO: Get or create survey based on scenario
    // For now, return a placeholder survey structure
    this._logger.info('get-survey-by-token.success', { token: request.token });

    return ResultEx.success({
      invitation: {
        id: invitation.id,
        projectId: invitation.projectId,
        token: invitation.token,
        email: invitation.email,
        status: invitation.status,
        sentAt: invitation.sentAt,
        respondedAt: invitation.completedAt, // Map completedAt to respondedAt
      },
      survey: {
        id: 'placeholder',
        token: invitation.token,
        projectId: invitation.projectId,
        questions: [], // TODO: Generate from scenario
        status: 'pending',
        startedAt: null,
        completedAt: null,
      },
    });
  }
}

