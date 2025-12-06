import { injectable, inject } from 'inversify';
import type { InvitationRepositoryPort } from '../../application/ports/invitation-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { Invitation, InvitationStatus } from '../../domain/entities/invitation.entity';
import { InvitationNotFoundError, InvalidTokenError, InvitationSendError } from '../../domain/errors/invitation.error';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class InvitationRepository implements InvitationRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async getByToken(token: string): Promise<Result<Invitation, InvalidTokenError>> {
    try {
      const response = await this._httpClient.get<{
        id: string;
        projectId: string;
        token: string;
        email: string;
        status: string;
        sentAt: string | null;
        respondedAt: string | null;
      }>(API_CONFIG.ENDPOINTS.SURVEY_BY_TOKEN(token));

      const invitation = new Invitation(
        response.id,
        response.projectId,
        response.token,
        response.email,
        response.status as InvitationStatus,
        response.sentAt ? new Date(response.sentAt) : null,
        response.respondedAt ? new Date(response.respondedAt) : null
      );

      return Result.success(invitation);
    } catch (error) {
      return Result.failure(new InvalidTokenError(token));
    }
  }

  async create(projectId: string, emails: string[]): Promise<Result<Invitation[], InvitationSendError>> {
    try {
      const response = await this._httpClient.post<Array<{
        id: string;
        projectId: string;
        token: string;
        email: string;
        status: string;
        sentAt: string | null;
        respondedAt: string | null;
      }>>(API_CONFIG.ENDPOINTS.INVITATIONS(projectId), { emails });

      const invitations = response.map(i => new Invitation(
        i.id,
        i.projectId,
        i.token,
        i.email,
        i.status as InvitationStatus,
        i.sentAt ? new Date(i.sentAt) : null,
        i.respondedAt ? new Date(i.respondedAt) : null
      ));

      return Result.success(invitations);
    } catch (error) {
      return Result.failure(new InvitationSendError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getStatuses(projectId: string): Promise<Result<Invitation[], never>> {
    try {
      const response = await this._httpClient.get<Array<{
        id: string;
        projectId: string;
        token: string;
        email: string;
        status: string;
        sentAt: string | null;
        respondedAt: string | null;
      }>>(API_CONFIG.ENDPOINTS.INVITATIONS(projectId));

      const invitations = response.map(i => new Invitation(
        i.id,
        i.projectId,
        i.token,
        i.email,
        i.status as InvitationStatus,
        i.sentAt ? new Date(i.sentAt) : null,
        i.respondedAt ? new Date(i.respondedAt) : null
      ));

      return Result.success(invitations);
    } catch (error) {
      return Result.success([]);
    }
  }

  async send(projectId: string): Promise<Result<void, InvitationSendError>> {
    try {
      await this._httpClient.post(API_CONFIG.ENDPOINTS.SEND_INVITATIONS(projectId), {});
      return Result.success(undefined);
    } catch (error) {
      return Result.failure(new InvitationSendError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}
