import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvitationEntity } from '../../domain/entities/invitation.entity';
import { InvitationNotFoundError } from '../../domain/errors/invitation.error';
import { InvitationRepositoryPort } from '../ports/invitation-repository.port';
import { EmailServicePort } from '../ports/email-service.port';
import type { SendInvitationsUseCaseInput, SendInvitationsUseCaseOutput } from './input-output/send-invitations.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class SendInvitationsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.InvitationRepository)
    private readonly _invitationRepository: InvitationRepositoryPort,
    @inject(TYPES.EmailService)
    private readonly _emailService: EmailServicePort
  ) {}

  async execute(
    input: SendInvitationsUseCaseInput
  ): Promise<ResultEx<SendInvitationsUseCaseOutput, InvitationNotFoundError>> {
    const { projectId, invitationIds, surveyBaseUrl } = input;
    const baseUrl = (surveyBaseUrl || '').replace(/\/$/, '');
    const errors: string[] = [];
    let sent = 0;
    let failed = 0;

    let idsToSend = invitationIds;
    if (idsToSend.length === 0) {
      const listResult = await this._invitationRepository.findByProjectId(projectId);
      if (!listResult.isSuccess) {
        return ResultEx.success({ sent: 0, failed: 0, errors: [listResult.error?.message || 'Failed to list invitations'] });
      }
      idsToSend = listResult.data
        .filter((inv) => inv.status === 'pending' && inv.email?.trim() && !inv.email.includes('@validatey.local') && !inv.email.startsWith('share-'))
        .map((inv) => inv.id);
    }

    for (const invitationId of idsToSend) {
      const findResult = await this._invitationRepository.findById(invitationId);
      if (!findResult.isSuccess) {
        failed++;
        errors.push(`Invitation ${invitationId}: not found`);
        continue;
      }

      const inv = findResult.data;
      if (inv.projectId !== projectId) {
        failed++;
        errors.push(`Invitation ${invitationId}: wrong project`);
        continue;
      }
      if (inv.status !== 'pending') {
        continue;
      }
      const email = inv.email?.trim();
      if (!email || email.includes('@validatey.local') || email.startsWith('share-')) {
        continue;
      }

      const surveyLink = `${baseUrl}/survey/${inv.token}`;
      const subject = 'Survey invitation';
      const html = `<p>You have been invited to take a survey.</p><p><a href="${surveyLink}">Open survey</a></p><p>Or copy this link: ${surveyLink}</p>`;
      const text = `You have been invited to take a survey. Open: ${surveyLink}`;

      const emailResult = await this._emailService.sendEmail({
        to: email,
        subject,
        html,
        text,
      });

      if (!emailResult.isSuccess) {
        failed++;
        errors.push(`Invitation ${invitationId} (${email}): ${emailResult.error?.message || 'send failed'}`);
        this._logger.warn('send-invitations.email-failed', { invitationId, email, error: emailResult.error });
        continue;
      }

      try {
        const entity = InvitationEntity.fromData(inv);
        const updated = entity.markAsSent();
        const updateResult = await this._invitationRepository.update(updated.toData());
        if (!updateResult.isSuccess) {
          failed++;
          errors.push(`Invitation ${invitationId}: failed to mark as sent`);
          continue;
        }
        sent++;
        this._logger.info('send-invitations.sent', { invitationId, email });
      } catch (e) {
        failed++;
        errors.push(`Invitation ${invitationId}: ${e instanceof Error ? e.message : 'update failed'}`);
      }
    }

    return ResultEx.success({
      sent,
      failed,
      ...(errors.length > 0 ? { errors } : {}),
    });
  }
}
