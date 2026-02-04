import { injectable, inject } from 'inversify';
import type { InvitationRepositoryPort } from '../../application/ports/invitation-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { Invitation } from '../../domain/entities/invitation.entity';

export type InvitationListItem = {
  id: string;
  email: string;
  status: string;
  sentAt: Date | null;
  respondedAt: Date | null;
  token?: string;
};

@injectable()
export class InvitationPresenter {
  constructor(
    @inject(TYPES.InvitationRepository)
    private readonly _repository: InvitationRepositoryPort
  ) {}

  async loadInvitations(projectId: string): Promise<{ invitations: InvitationListItem[]; error?: string }> {
    const result = await this._repository.getStatuses(projectId);
    if (!result.isSuccess) {
      return { invitations: [], error: result.error?.message };
    }
    const invitations = (result.data as Invitation[]).map((inv) => ({
      id: inv.id,
      email: inv.email ?? '',
      status: inv.status,
      sentAt: inv.sentAt,
      respondedAt: inv.respondedAt,
      token: inv.token,
    }));
    return { invitations };
  }

  async createInvitations(
    projectId: string,
    emails: string[]
  ): Promise<{ invitations: InvitationListItem[]; error?: string }> {
    const result = await this._repository.create(projectId, emails);
    if (!result.isSuccess) {
      return { invitations: [], error: result.error?.message };
    }
    const invitations = result.data.map((inv) => ({
      id: inv.id,
      email: inv.email ?? '',
      status: inv.status,
      sentAt: inv.sentAt,
      respondedAt: inv.respondedAt,
      token: inv.token,
    }));
    return { invitations };
  }

  /**
   * Send invitation emails (pending invitations). If invitationIds is omitted, sends all pending for the project.
   */
  async sendInvitations(
    projectId: string,
    invitationIds?: string[]
  ): Promise<{ sent: number; failed: number; errors?: string[]; error?: string }> {
    const result = await this._repository.send(projectId, invitationIds);
    if (!result.isSuccess) {
      return { sent: 0, failed: 0, error: result.error?.message };
    }
    return result.data;
  }

  /**
   * Create a single invitation with placeholder email for share link; returns the survey URL.
   */
  async createShareLink(projectId: string): Promise<{ url: string; error?: string }> {
    const placeholderEmail = `share-${projectId}@validatey.local`;
    const result = await this._repository.create(projectId, [placeholderEmail]);
    if (!result.isSuccess) {
      return { url: '', error: result.error?.message };
    }
    const inv = result.data[0];
    if (!inv) {
      return { url: '', error: 'No invitation created' };
    }
    const baseUrl = typeof window !== 'undefined'
      ? window.location.origin
      : '';
    const url = `${baseUrl}/survey/${inv.token}`;
    return { url };
  }
}
