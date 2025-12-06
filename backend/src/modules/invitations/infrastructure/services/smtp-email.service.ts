import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { EmailServicePort, SendEmailRequest } from '../../application/ports/email-service.port';

@injectable()
export class SMTPEmailService implements EmailServicePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async sendEmail(request: SendEmailRequest): Promise<ResultEx<void, Error>> {
    this._logger.info('smtp-email-service.send-email.start', { to: request.to });

    try {
      // TODO: Implement actual SMTP email sending
      // For now, just log the email
      this._logger.info('smtp-email-service.send-email.success', {
        to: request.to,
        subject: request.subject,
      });

      // In production, use nodemailer or similar
      // const transporter = nodemailer.createTransport({...});
      // await transporter.sendMail({...});

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('smtp-email-service.send-email.error', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}

