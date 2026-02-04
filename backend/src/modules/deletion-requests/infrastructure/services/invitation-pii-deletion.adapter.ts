import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { PiiDeletionPort } from '../../application/ports/pii-deletion.port';
import { DeletionRequestRepositoryPort } from '../../application/ports/deletion-request-repository.port';
import { InvitationRepositoryPort } from '../../../invitations/application/ports/invitation-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import type { Invitation } from '../../../invitations/domain/entities/invitation.entity';

/**
 * Anonymizes PII (email, phone) for invitations matching the deletion request's identifier.
 */
@injectable()
export class InvitationPiiDeletionAdapter implements PiiDeletionPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.DeletionRequestRepository)
    private readonly _deletionRequestRepository: DeletionRequestRepositoryPort,
    @inject(INVITATION_TYPES.InvitationRepository)
    private readonly _invitationRepository: InvitationRepositoryPort
  ) {}

  async executeByRequestId(requestId: string): Promise<ResultEx<void, Error>> {
    const requestResult = await this._deletionRequestRepository.findById(requestId);
    if (!requestResult.isSuccess) {
      return ResultEx.failure(requestResult.error);
    }
    const req = requestResult.data;
    const invitationsResult = await this._invitationRepository.findByProjectId(req.projectId);
    if (!invitationsResult.isSuccess) {
      return ResultEx.failure(invitationsResult.error);
    }
    const identifierLower = req.identifier.trim().toLowerCase();
    let updated = 0;
    for (const inv of invitationsResult.data) {
      const match =
        (inv.email && inv.email.trim().toLowerCase() === identifierLower) ||
        (inv.phone && inv.phone.trim() === req.identifier.trim());
      if (match) {
        const anonymized: Invitation = {
          ...inv,
          email: null,
          phone: null,
          updatedAt: new Date(),
        };
        const updateResult = await this._invitationRepository.update(anonymized);
        if (updateResult.isSuccess) updated++;
      }
    }
    this._logger.info('invitation-pii-deletion.completed', { requestId, projectId: req.projectId, anonymizedCount: updated });
    return ResultEx.success(undefined);
  }
}
