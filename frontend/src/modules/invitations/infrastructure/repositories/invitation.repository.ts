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
        invitation: {
          id: string;
          projectId: string;
          token: string;
          email: string | null;
          status: string;
          sentAt: string | null;
          respondedAt: string | null;
        };
        survey: any;
      }>(API_CONFIG.ENDPOINTS.SURVEY_BY_TOKEN(token));

      // Extract invitation from response
      const invitationData = response.invitation;

      const email = (invitationData.email && invitationData.email.trim())
        ? invitationData.email
        : '(share link)';
      const invitation = new Invitation(
        invitationData.id,
        invitationData.projectId,
        invitationData.token,
        email,
        invitationData.status as InvitationStatus,
        invitationData.sentAt ? new Date(invitationData.sentAt) : null,
        invitationData.respondedAt ? new Date(invitationData.respondedAt) : null
      );

      return Result.success(invitation);
    } catch (error) {
      return Result.failure(new InvalidTokenError(token));
    }
  }

  async create(projectId: string, emails: string[]): Promise<Result<Invitation[], InvitationSendError>> {
    try {
      const data = await this._httpClient.post<{
        invitations: Array<{
          id: string;
          projectId: string;
          token: string;
          email: string | null;
          status: string;
          sentAt: string | null;
          completedAt?: string | null;
          respondedAt?: string | null;
        }>;
      }>(API_CONFIG.ENDPOINTS.INVITATIONS(projectId), { emails });

      const list = data.invitations ?? [];
      const invitations = list.map(i => new Invitation(
        i.id,
        i.projectId,
        i.token,
        (i.email && i.email.trim()) ? i.email : '(share link)',
        i.status as InvitationStatus,
        i.sentAt ? new Date(i.sentAt) : null,
        (i.respondedAt ? new Date(i.respondedAt) : i.completedAt ? new Date(i.completedAt) : null) as Date | null
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
        (i.email && i.email.trim()) ? i.email : '(share link)',
        i.status as InvitationStatus,
        i.sentAt ? new Date(i.sentAt) : null,
        i.respondedAt ? new Date(i.respondedAt) : null
      ));

      return Result.success(invitations);
    } catch (error) {
      return Result.success([]);
    }
  }

  async send(projectId: string, invitationIds?: string[]): Promise<Result<{ sent: number; failed: number; errors?: string[] }, InvitationSendError>> {
    try {
      const data = await this._httpClient.post<{ sent: number; failed: number; errors?: string[] }>(
        API_CONFIG.ENDPOINTS.SEND_INVITATIONS(projectId),
        { invitationIds: invitationIds ?? [] }
      );
      return Result.success({ sent: data.sent ?? 0, failed: data.failed ?? 0, errors: data.errors });
    } catch (error) {
      return Result.failure(new InvitationSendError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}
