export type InvitationStatus = 'pending' | 'sent' | 'opened' | 'completed' | 'responded' | 'expired';

export interface Invitation {
  readonly id: string;
  readonly projectId: string;
  readonly token: string;
  readonly email: string | null;
  readonly phone: string | null;
  readonly status: InvitationStatus;
  readonly sentAt: Date | null;
  readonly openedAt: Date | null;
  readonly completedAt: Date | null;
  readonly reminderCount: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class InvitationEntity {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly token: string,
    public readonly email: string | null,
    public readonly phone: string | null,
    public readonly status: InvitationStatus,
    public readonly sentAt: Date | null,
    public readonly openedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly reminderCount: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(projectId: string, email?: string, phone?: string): InvitationEntity {
    if (!email && !phone) {
      throw new Error('Either email or phone must be provided');
    }

    if (email && !this.isValidEmail(email)) {
      throw new Error('Invalid email format');
    }

    const now = new Date();
    return new InvitationEntity(
      this.generateId(),
      projectId,
      this.generateToken(),
      email || null,
      phone || null,
      'pending',
      null,
      null,
      null,
      0,
      now,
      now
    );
  }

  static fromData(data: Invitation): InvitationEntity {
    return new InvitationEntity(
      data.id,
      data.projectId,
      data.token,
      data.email,
      data.phone,
      data.status,
      data.sentAt,
      data.openedAt,
      data.completedAt,
      data.reminderCount,
      data.createdAt,
      data.updatedAt
    );
  }

  markAsSent(): InvitationEntity {
    if (this.status !== 'pending') {
      throw new Error('Only pending invitations can be marked as sent');
    }
    return new InvitationEntity(
      this.id,
      this.projectId,
      this.token,
      this.email,
      this.phone,
      'sent',
      new Date(),
      this.openedAt,
      this.completedAt,
      this.reminderCount,
      this.createdAt,
      new Date()
    );
  }

  markAsOpened(): InvitationEntity {
    if (this.status === 'pending') {
      throw new Error('Invitation must be sent before it can be opened');
    }
    if (this.status === 'completed') {
      return this; // Already completed, no change
    }
    return new InvitationEntity(
      this.id,
      this.projectId,
      this.token,
      this.email,
      this.phone,
      'opened',
      this.sentAt,
      new Date(),
      this.completedAt,
      this.reminderCount,
      this.createdAt,
      new Date()
    );
  }

  markAsCompleted(): InvitationEntity {
    if (this.status === 'pending') {
      throw new Error('Invitation must be sent before it can be completed');
    }
    return new InvitationEntity(
      this.id,
      this.projectId,
      this.token,
      this.email,
      this.phone,
      'completed',
      this.sentAt,
      this.openedAt || new Date(),
      new Date(),
      this.reminderCount,
      this.createdAt,
      new Date()
    );
  }

  incrementReminderCount(): InvitationEntity {
    return new InvitationEntity(
      this.id,
      this.projectId,
      this.token,
      this.email,
      this.phone,
      this.status,
      this.sentAt,
      this.openedAt,
      this.completedAt,
      this.reminderCount + 1,
      this.createdAt,
      new Date()
    );
  }

  toData(): Invitation {
    return {
      id: this.id,
      projectId: this.projectId,
      token: this.token,
      email: this.email,
      phone: this.phone,
      status: this.status,
      sentAt: this.sentAt,
      openedAt: this.openedAt,
      completedAt: this.completedAt,
      reminderCount: this.reminderCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static generateToken(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 16)}_${Math.random().toString(36).substr(2, 16)}`;
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

