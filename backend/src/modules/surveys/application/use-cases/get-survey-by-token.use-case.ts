import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { GetSurveyByTokenUseCaseRequest, GetSurveyByTokenUseCaseResponse } from './input-output/get-survey-by-token.io';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import { GetInvitationByTokenUseCase } from '../../../invitations/application/use-cases/get-invitation-by-token.use-case';
import { TYPES as SCENARIO_TYPES } from '../../../scenarios/infrastructure/bootstrap/types';
import { ScenarioRepositoryPort } from '../../../scenarios/application/ports/scenario-repository.port';
import { ScenarioParserService } from '../../domain/services/scenario-parser.service';
import { SurveyNotFoundError } from '../../domain/errors/survey.error';

@injectable()
export class GetSurveyByTokenUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(INVITATION_TYPES.GetInvitationByTokenUseCase)
    private readonly _getInvitationByTokenUseCase: GetInvitationByTokenUseCase,
    @inject(SCENARIO_TYPES.ScenarioRepository)
    private readonly _scenarioRepository: ScenarioRepositoryPort
  ) {}

  async execute(
    request: GetSurveyByTokenUseCaseRequest
  ): Promise<ResultEx<GetSurveyByTokenUseCaseResponse, SurveyNotFoundError>> {
    this._logger.info('get-survey-by-token.start', { token: request.token });

    // Get invitation by token
    const invitationResult = await this._getInvitationByTokenUseCase.execute({ token: request.token });

    if (!invitationResult.isSuccess) {
      this._logger.warn('get-survey-by-token.invitation-not-found', { 
        token: request.token,
        error: invitationResult.error?.message || 'Unknown error'
      });
      return ResultEx.failure(new SurveyNotFoundError(`Invalid invitation token: ${request.token}`));
    }

    const invitation = invitationResult.data.invitation;

    // Get latest scenario for the project
    const scenariosResult = await this._scenarioRepository.findByProjectId(invitation.projectId);

    if (!scenariosResult.isSuccess || !scenariosResult.data || scenariosResult.data.length === 0) {
      this._logger.warn('get-survey-by-token.no-scenario', {
        token: request.token,
        projectId: invitation.projectId,
      });
      return ResultEx.failure(
        new SurveyNotFoundError(`No scenario found for project ${invitation.projectId}`)
      );
    }

    // Get the latest scenario (first in array, sorted by version desc)
    const latestScenario = scenariosResult.data[0];

    // Parse scenario content into questions
    const questions = ScenarioParserService.parse(latestScenario.content);

    if (questions.length === 0) {
      this._logger.warn('get-survey-by-token.no-questions', {
        token: request.token,
        scenarioId: latestScenario.id,
      });
    }

    this._logger.info('get-survey-by-token.success', {
      token: request.token,
      projectId: invitation.projectId,
      scenarioId: latestScenario.id,
      questionsCount: questions.length,
    });

    // Generate survey ID based on invitation token
    const surveyId = `surv_${invitation.id}`;

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
        id: surveyId,
        token: invitation.token,
        projectId: invitation.projectId,
        questions: questions.map((q) => ({
          id: q.id,
          type: q.type,
          text: q.text,
          required: q.required,
          options: q.options,
        })),
        status: 'pending',
        startedAt: null,
        completedAt: null,
      },
    });
  }
}

