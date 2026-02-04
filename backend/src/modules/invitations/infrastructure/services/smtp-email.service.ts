import { injectable, inject } from 'inversify';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSmtpConfig } from '../../../../infrastructure/config/smtp.config';
import { EmailServicePort, SendEmailRequest } from '../../application/ports/email-service.port';

@injectable()
export class SMTPEmailService implements EmailServicePort {
  private _transporter: Transporter | null = null;

  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  private getTransporter(): Transporter | null {
    if (this._transporter) return this._transporter;
    const config = getSmtpConfig();
    if (!config) return null;
    this._transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    });
    return this._transporter;
  }

  async sendEmail(request: SendEmailRequest): Promise<ResultEx<void, Error>> {
    this._logger.info('smtp-email-service.send-email.start', { to: request.to });

    const transporter = this.getTransporter();
    if (!transporter) {
      this._logger.info('smtp-email-service.send-email.skip-no-config', {
        to: request.to,
        subject: request.subject,
      });
      return ResultEx.success(undefined);
    }

    try {
      const config = getSmtpConfig();
      const from = config?.from ?? 'noreply@validatey.local';
      await transporter.sendMail({
        from,
        to: request.to,
        subject: request.subject,
        html: request.html,
        text: request.text ?? undefined,
      });
      this._logger.info('smtp-email-service.send-email.success', {
        to: request.to,
        subject: request.subject,
      });
      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('smtp-email-service.send-email.error', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
