import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvitationRepositoryPort } from '../ports/invitation-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetInvitationsByProjectIdUseCaseRequest, GetInvitationsByProjectIdUseCaseResponse } from './input-output/get-invitations-by-project-id.io';

@injectable()
export class GetInvitationsByProjectIdUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.InvitationRepository)
    private readonly _invitationRepository: InvitationRepositoryPort
  ) {}

  async execute(
    request: GetInvitationsByProjectIdUseCaseRequest
  ): Promise<ResultEx<GetInvitationsByProjectIdUseCaseResponse, Error>> {
    this._logger.info('get-invitations-by-project-id.start', { projectId: request.projectId });

    try {
      const result = await this._invitationRepository.findByProjectId(request.projectId);

      if (!result.isSuccess) {
        this._logger.error('get-invitations-by-project-id.error', {
          projectId: request.projectId,
          error: result.error,
        });
        return ResultEx.failure(result.error);
      }

      const invitations = result.data.map(inv => ({
        id: inv.id,
        projectId: inv.projectId,
        token: inv.token,
        email: inv.email || '',
        status: inv.status,
        sentAt: inv.sentAt,
        respondedAt: inv.completedAt,
      }));

      this._logger.info('get-invitations-by-project-id.success', {
        projectId: request.projectId,
        count: invitations.length,
      });

      return ResultEx.success({ invitations });
    } catch (error) {
      this._logger.error('get-invitations-by-project-id.exception', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
