import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { container } from '../../../../infrastructure/bootstrap/container';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { SurveyPlatformsLlmPort } from '../../../projects/application/ports/survey-platforms-llm.port';
import { AiModuleError } from '../../../ai/domain/errors/ai.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

export interface SuggestSurveyPlatformsRequest {
  readonly projectId: string;
  readonly userId: string;
}

export interface SuggestSurveyPlatformsResponse {
  readonly platforms: Array<{
    platform: string;
    subplatform?: string;
    reason: string;
    postingStrategy: string;
    expectedReach: string;
    post: string;
  }>;
}

@injectable()
export class SuggestSurveyPlatformsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(TYPES.SurveyPlatformsLlm)
    private readonly _surveyPlatformsLlm: SurveyPlatformsLlmPort
  ) {}

  async execute(
    request: SuggestSurveyPlatformsRequest
  ): Promise<ResultEx<SuggestSurveyPlatformsResponse, AiModuleError>> {
    this._logger.info('suggest-survey-platforms.start', { projectId: request.projectId, userId: request.userId });

    // TODO: Re-enable access check when authentication is properly set up
    // // Проверка доступа к проекту
    // const accessResult = await this._projectRepository.userHasAccessToProject(request.projectId, request.userId);
    // if (!accessResult.isSuccess) {
    //   return ResultEx.failure(accessResult.error);
    // }
    // if (!accessResult.data) {
    //   this._logger.warn('suggest-survey-platforms.access-denied', {
    //     projectId: request.projectId,
    //     userId: request.userId
    //   });
    //   return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
    // }

    // Получение проекта
    const projectResult = await this._projectRepository.findById(request.projectId);
    if (!projectResult.isSuccess) {
      this._logger.error('suggest-survey-platforms.project-not-found', {
        projectId: request.projectId,
        error: projectResult.error.message
      });
      return ResultEx.failure(new AiModuleError(`Project not found: ${request.projectId}`));
    }

    const project = projectResult.data;

    // Формирование входных данных для AI на основе данных проекта
    const aiInput = {
      targetSegment: project.segment?.description,
      productHypothesis: project.hypothesis?.description,
      hypothesisAssumptions: project.hypothesis?.assumptions?.map(a => a.text) || null,
      targetAudience: project.targetAudience,
      marketContext: project.marketContext?.marketFit,
      productCost: project.cost,
    };

    this._logger.info('suggest-survey-platforms.calling-ai', {
      projectId: request.projectId,
      hasSegment: !!aiInput.targetSegment,
      hasHypothesis: !!aiInput.productHypothesis,
      hasTargetAudience: !!aiInput.targetAudience,
    });

    // Вызов AI через порт
    const aiResult = await this._surveyPlatformsLlm.suggest(aiInput);

    if (!aiResult.isSuccess) {
      this._logger.error('suggest-survey-platforms.ai-failed', {
        projectId: request.projectId,
        error: aiResult.error.message
      });
      return ResultEx.failure(aiResult.error);
    }

    this._logger.info('suggest-survey-platforms.success', {
      projectId: request.projectId,
      platformsCount: aiResult.data.length
    });

    return ResultEx.success({
      platforms: aiResult.data,
    });
  }
}