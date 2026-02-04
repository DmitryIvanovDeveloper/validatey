import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ConsentEntity } from '../../domain/entities/consent.entity';
import {
  ConsentAlreadyGivenError,
  InvalidConsentDataError,
} from '../../domain/errors/consent.error';
import { ConsentRepositoryPort } from '../ports/consent-repository.port';
import { InvitationRepositoryPort } from '../../../invitations/application/ports/invitation-repository.port';
import { RecordConsentUseCaseRequest, RecordConsentUseCaseResponse } from './input-output/record-consent.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';

@injectable()
export class RecordConsentUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ConsentRepository)
    private readonly _consentRepository: ConsentRepositoryPort,
    @inject(INVITATION_TYPES.InvitationRepository)
    private readonly _invitationRepository: InvitationRepositoryPort
  ) {}

  async execute(
    request: RecordConsentUseCaseRequest
  ): Promise<ResultEx<RecordConsentUseCaseResponse, InvalidConsentDataError | ConsentAlreadyGivenError>> {
    this._logger.info('record-consent.start', { token: request.invitationToken.substring(0, 10) + '...' });

    const invitationResult = await this._invitationRepository.findByToken(request.invitationToken);
    if (!invitationResult.isSuccess) {
      return ResultEx.failure(new InvalidConsentDataError('Invalid invitation token'));
    }
    const invitation = invitationResult.data;

    const existingResult = await this._consentRepository.findByInvitationId(invitation.id);
    if (!existingResult.isSuccess) {
      this._logger.error('record-consent.find-error', { error: existingResult.error });
      return ResultEx.failure(new InvalidConsentDataError('Failed to check existing consent'));
    }
    if (existingResult.data !== null) {
      return ResultEx.failure(new ConsentAlreadyGivenError(invitation.id));
    }

    const consent = ConsentEntity.create({
      projectId: invitation.projectId,
      invitationId: invitation.id,
      consentTextId: request.consentTextId ?? null,
      consentText: request.consentText ?? null,
      ip: request.ip ?? null,
      userAgent: request.userAgent ?? null,
    });

    const saveResult = await this._consentRepository.save(consent.toData());
    if (!saveResult.isSuccess) {
      this._logger.error('record-consent.save-error', { error: saveResult.error });
      return ResultEx.failure(saveResult.error);
    }

    this._logger.info('record-consent.success', { consentId: saveResult.data.id, invitationId: invitation.id });
    return ResultEx.success({
      consentId: saveResult.data.id,
      acceptedAt: saveResult.data.acceptedAt,
    });
  }
}
