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

function buildInvitationEmailHtml(surveyLink: string): string {
  const escapedLink = surveyLink.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Survey invitation</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color:#ffffff; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="margin:0 0 8px; font-size: 20px; font-weight: 600; color: #0f172a;">Survey invitation</h1>
              <p style="margin:0 0 24px; font-size: 15px; line-height: 1.6; color: #475569;">You have been invited to take a short survey. Your feedback helps us improve.</p>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 0 0 24px;">
                <tr>
                  <td style="border-radius: 8px; background-color: #0d9488;">
                    <a href="${escapedLink}" target="_blank" rel="noopener" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 500; color: #ffffff; text-decoration: none;">Open survey</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0; font-size: 13px; line-height: 1.5; color: #94a3b8;">If the button does not work, copy and paste this link into your browser:</p>
              <p style="margin: 8px 0 0; font-size: 13px; word-break: break-all; color: #64748b;"><a href="${escapedLink}" style="color: #0d9488; text-decoration: none;">${escapedLink}</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

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
      const html = buildInvitationEmailHtml(surveyLink);
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
