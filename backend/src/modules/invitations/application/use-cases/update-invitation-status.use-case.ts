import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvitationEntity } from '../../domain/entities/invitation.entity';
import { InvitationNotFoundError, InvalidInvitationDataError } from '../../domain/errors/invitation.error';
import { InvitationRepositoryPort } from '../ports/invitation-repository.port';
import { UpdateInvitationStatusUseCaseRequest, UpdateInvitationStatusUseCaseResponse } from './input-output/update-invitation-status.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class UpdateInvitationStatusUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.InvitationRepository)
    private readonly _repository: InvitationRepositoryPort
  ) {}

  async execute(
    request: UpdateInvitationStatusUseCaseRequest
  ): Promise<ResultEx<UpdateInvitationStatusUseCaseResponse, InvitationNotFoundError | InvalidInvitationDataError>> {
    this._logger.info('update-invitation-status.start', {
      invitationId: request.invitationId,
      status: request.status,
    });

    const findResult = await this._repository.findById(request.invitationId);

    if (!findResult.isSuccess) {
      this._logger.error('update-invitation-status.not-found', { invitationId: request.invitationId });
      return ResultEx.failure(findResult.error);
    }

    try {
      const existingInvitation = InvitationEntity.fromData(findResult.data);
      let updatedInvitation: InvitationEntity;

      switch (request.status) {
        case 'sent':
          updatedInvitation = existingInvitation.markAsSent();
          break;
        case 'opened':
          updatedInvitation = existingInvitation.markAsOpened();
          break;
        case 'completed':
          updatedInvitation = existingInvitation.markAsCompleted();
          break;
        case 'pending':
          // Cannot revert to pending
          return ResultEx.failure(new InvalidInvitationDataError('Cannot revert invitation to pending status'));
        default:
          return ResultEx.failure(new InvalidInvitationDataError(`Invalid status: ${request.status}`));
      }

      const updateResult = await this._repository.update(updatedInvitation.toData());

      if (!updateResult.isSuccess) {
        this._logger.error('update-invitation-status.update-error', { error: updateResult.error });
        return ResultEx.failure(updateResult.error);
      }

      this._logger.info('update-invitation-status.success', {
        invitationId: updateResult.data.id,
        status: updateResult.data.status,
      });

      return ResultEx.success({
        invitation: updateResult.data,
      });
    } catch (error) {
      this._logger.error('update-invitation-status.error', { error });
      if (error instanceof InvalidInvitationDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidInvitationDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}



