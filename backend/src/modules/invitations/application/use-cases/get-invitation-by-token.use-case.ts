import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvitationNotFoundError } from '../../domain/errors/invitation.error';
import { InvitationRepositoryPort } from '../ports/invitation-repository.port';
import { GetInvitationByTokenUseCaseRequest, GetInvitationByTokenUseCaseResponse } from './input-output/get-invitation-by-token.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetInvitationByTokenUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.InvitationRepository)
    private readonly _repository: InvitationRepositoryPort
  ) {}

  async execute(
    request: GetInvitationByTokenUseCaseRequest
  ): Promise<ResultEx<GetInvitationByTokenUseCaseResponse, InvitationNotFoundError>> {
    this._logger.info('get-invitation-by-token.start', { token: request.token.substring(0, 10) + '...' });

    const findResult = await this._repository.findByToken(request.token);

    if (!findResult.isSuccess) {
      this._logger.error('get-invitation-by-token.not-found', { token: request.token.substring(0, 10) + '...' });
      return ResultEx.failure(findResult.error);
    }

    this._logger.info('get-invitation-by-token.success', { invitationId: findResult.data.id });

    return ResultEx.success({
      invitation: findResult.data,
    });
  }
}



