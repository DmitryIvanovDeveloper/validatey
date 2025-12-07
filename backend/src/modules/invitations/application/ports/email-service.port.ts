import ResultEx from '../../../../infrastructure/result/result';

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailServicePort {
  sendEmail(request: SendEmailRequest): Promise<ResultEx<void, Error>>;
}


