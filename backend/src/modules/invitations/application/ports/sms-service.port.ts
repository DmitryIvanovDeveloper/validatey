import ResultEx from '../../../../infrastructure/result/result';

export interface SendSMSRequest {
  to: string;
  message: string;
}

export interface SMSServicePort {
  sendSMS(request: SendSMSRequest): Promise<ResultEx<void, Error>>;
}


