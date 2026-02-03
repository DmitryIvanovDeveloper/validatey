export type InvitationStatus = 'pending' | 'sent' | 'responded' | 'completed' | 'expired';

export class Invitation {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly token: string,
    public readonly email: string,
    public readonly status: InvitationStatus,
    public readonly sentAt: Date | null,
    public readonly respondedAt: Date | null
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Invitation id cannot be empty');
    }
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Invitation projectId cannot be empty');
    }
    if (!token || token.trim().length === 0) {
      throw new Error('Invitation token cannot be empty');
    }
    if (!email || email.trim().length === 0) {
      throw new Error('Invitation email cannot be empty');
    }
  }
}



