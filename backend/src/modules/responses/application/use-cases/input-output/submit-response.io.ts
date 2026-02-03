import { Response } from '../../../domain/entities/response.entity';

export type SubmitResponseUseCaseRequest = {
  invitationToken: string;
  answers: Record<string, any>;
  audioFile?: {
    buffer: Buffer;
    filename: string;
    contentType: string;
  };
};

export type SubmitResponseUseCaseResponse = {
  response: Response;
};



