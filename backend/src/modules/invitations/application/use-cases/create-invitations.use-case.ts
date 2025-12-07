import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvitationEntity } from '../../domain/entities/invitation.entity';
import { InvalidInvitationDataError } from '../../domain/errors/invitation.error';
import { InvitationRepositoryPort } from '../ports/invitation-repository.port';
import { CreateInvitationsUseCaseRequest, CreateInvitationsUseCaseResponse } from './input-output/create-invitations.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CreateInvitationsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.InvitationRepository)
    private readonly _repository: InvitationRepositoryPort
  ) {}

  async execute(
    request: CreateInvitationsUseCaseRequest
  ): Promise<ResultEx<CreateInvitationsUseCaseResponse, InvalidInvitationDataError>> {
    this._logger.info('create-invitations.start', {
      projectId: request.projectId,
      count: request.contacts.length,
    });

    try {
      if (request.contacts.length === 0) {
        return ResultEx.failure(new InvalidInvitationDataError('At least one contact is required'));
      }

      const invitations = request.contacts.map((contact) =>
        InvitationEntity.create(request.projectId, contact.email, contact.phone)
      );

      const saveResult = await this._repository.createMany(invitations.map((inv) => inv.toData()));

      if (!saveResult.isSuccess) {
        this._logger.error('create-invitations.save-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      this._logger.info('create-invitations.success', {
        projectId: request.projectId,
        count: saveResult.data.length,
      });

      return ResultEx.success({
        invitations: saveResult.data,
      });
    } catch (error) {
      this._logger.error('create-invitations.error', { error });
      if (error instanceof InvalidInvitationDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidInvitationDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}


