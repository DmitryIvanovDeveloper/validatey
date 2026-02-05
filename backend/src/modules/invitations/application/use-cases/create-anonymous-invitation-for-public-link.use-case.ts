import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvitationEntity } from '../../domain/entities/invitation.entity';
import { InvalidInvitationDataError } from '../../domain/errors/invitation.error';
import { InvitationRepositoryPort } from '../ports/invitation-repository.port';
import { CreateAnonymousInvitationForPublicLinkUseCaseRequest, CreateAnonymousInvitationForPublicLinkUseCaseResponse } from './input-output/create-anonymous-invitation-for-public-link.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ResponseRepositoryPort } from '../../../responses/application/ports/response-repository.port';
import { TYPES as RESPONSE_TYPES } from '../../../responses/infrastructure/bootstrap/types';
import { ProjectNotFoundError, PublicLinkNotEnabledError, MaxPublicResponsesReachedError } from '../../../projects/domain/errors/project.error';

@injectable()
export class CreateAnonymousInvitationForPublicLinkUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.InvitationRepository)
    private readonly _invitationRepository: InvitationRepositoryPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(RESPONSE_TYPES.ResponseRepository)
    private readonly _responseRepository: ResponseRepositoryPort
  ) {}

  async execute(
    request: CreateAnonymousInvitationForPublicLinkUseCaseRequest
  ): Promise<
    ResultEx<
      CreateAnonymousInvitationForPublicLinkUseCaseResponse,
      ProjectNotFoundError | PublicLinkNotEnabledError | MaxPublicResponsesReachedError | InvalidInvitationDataError
    >
  > {
    this._logger.info('create-anonymous-invitation-for-public-link.start', { slug: request.publicSlug.substring(0, 8) + '...' });

    const projectResult = await this._projectRepository.findByPublicSlug(request.publicSlug);
    if (!projectResult.isSuccess) {
      return ResultEx.failure(projectResult.error);
    }
    const project = projectResult.data;

    if (!project.publicAccessEnabled) {
      this._logger.warn('create-anonymous-invitation-for-public-link.not-enabled', { slug: request.publicSlug });
      return ResultEx.failure(new PublicLinkNotEnabledError(request.publicSlug));
    }

    const countResult = await this._responseRepository.countPublicByProjectId(project.id);
    if (!countResult.isSuccess) {
      this._logger.error('create-anonymous-invitation-for-public-link.count-error', { error: countResult.error });
      return ResultEx.failure(new InvalidInvitationDataError('Failed to check public response count'));
    }
    const max = project.maxPublicResponses ?? null;
    if (max !== null && countResult.data >= max) {
      this._logger.warn('create-anonymous-invitation-for-public-link.limit-reached', { projectId: project.id });
      return ResultEx.failure(new MaxPublicResponsesReachedError(project.id));
    }

    const invitation = InvitationEntity.createAnonymous(project.id);
    const createResult = await this._invitationRepository.create(invitation.toData());
    if (!createResult.isSuccess) {
      this._logger.error('create-anonymous-invitation-for-public-link.create-error', { error: createResult.error });
      return ResultEx.failure(createResult.error);
    }

    const created = createResult.data;
    this._logger.info('create-anonymous-invitation-for-public-link.success', { invitationId: created.id, projectId: project.id });

    return ResultEx.success({
      token: created.token,
      invitationId: created.id,
      projectId: project.id,
    });
  }
}
