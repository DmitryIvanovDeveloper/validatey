import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { SMSServicePort, SendSMSRequest } from '../../application/ports/sms-service.port';

@injectable()
export class SMSProviderService implements SMSServicePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async sendSMS(request: SendSMSRequest): Promise<ResultEx<void, Error>> {
    this._logger.info('sms-provider-service.send-sms.start', { to: request.to });

    try {
      // TODO: Implement actual SMS sending
      // For now, just log the SMS
      this._logger.info('sms-provider-service.send-sms.success', {
        to: request.to,
        messageLength: request.message.length,
      });

      // In production, use Twilio, AWS SNS, or similar
      // await smsProvider.send({...});

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('sms-provider-service.send-sms.error', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}



