import type { ModerationStatus } from '../../../domain/entities/response.entity';

export interface ModerateResponseUseCaseRequest {
  responseId: string;
  status: ModerationStatus;
}

export interface ModerateResponseUseCaseResponse {
  success: boolean;
  error?: string;
}