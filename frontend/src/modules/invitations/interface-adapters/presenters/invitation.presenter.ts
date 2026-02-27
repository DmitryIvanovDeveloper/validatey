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
  readonly labels = {
    pageTitle: 'Invitations',
    pageSubtitle: 'Send and track survey invitations by email or share a single link.',
    back: 'Back',
    sendInvitations: 'Send invitations',
    publicLink: 'Public link',
    publicLinkSubtitle: 'One link, many respondents. Limit and moderate responses.',
    personalInvitations: 'Personal invitations',
    surveyConsent: 'Survey consent',
    enablePublicAccess: 'Enable public access',
    copy: 'Copy',
    copied: 'Copied',
    errorLoadInvitations: 'Failed to load invitations',
  };

  constructor(
    @inject(TYPES.InvitationRepository)
    private readonly _repository: InvitationRepositoryPort
  ) {}

  async loadInvitations(projectId: string): Promise<{ invitations: InvitationListItem[]; error?: string }> {
    const result = await this._repository.getStatuses(projectId);
    if (!result.isSuccess) {
      const err = result.error as Error | undefined;
      return { invitations: [], error: err?.message ?? 'Failed to load invitations' };
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
   * Create a new invitation with unique placeholder email; returns a survey URL for one respondent.
   * Each call generates a new link (new token).
   */
  async createShareLink(projectId: string): Promise<{ url: string; error?: string }> {
    const unique = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const placeholderEmail = `share-${projectId}-${unique}@validatey.local`;
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
