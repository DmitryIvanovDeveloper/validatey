import ResultEx from '../../../../infrastructure/result/result';
import { Response } from '../../domain/entities/response.entity';
import type { ModerationStatus } from '../../domain/entities/response.entity';
import { ResponseNotFoundError, InvalidResponseDataError } from '../../domain/errors/response.error';

export interface ResponseRepositoryPort {
  create(response: Response): Promise<ResultEx<Response, InvalidResponseDataError>>;
  findById(id: string): Promise<ResultEx<Response, ResponseNotFoundError>>;
  findByInvitationId(invitationId: string): Promise<ResultEx<Response | null, Error>>;
  findByProjectId(projectId: string): Promise<ResultEx<Response[], Error>>;
  /** List responses by project with optional moderation filter (for public-link moderation). */
  listByProjectId(projectId: string, filters?: { moderationStatus?: ModerationStatus | null }): Promise<ResultEx<Response[], Error>>;
  /** Count responses from anonymous (public-link) invitations for project. */
  countPublicByProjectId(projectId: string): Promise<ResultEx<number, Error>>;
  update(response: Response): Promise<ResultEx<Response, ResponseNotFoundError | InvalidResponseDataError>>;
  updateModerationStatus(responseId: string, status: ModerationStatus): Promise<ResultEx<Response, ResponseNotFoundError | InvalidResponseDataError>>;
}



