import { randomUUID } from 'crypto';

export interface Consent {
  readonly id: string;
  readonly projectId: string;
  readonly invitationId: string;
  /** Snapshot of consent text or reference id at acceptance time */
  readonly consentTextId: string | null;
  readonly consentText: string | null;
  readonly acceptedAt: Date;
  readonly ip: string | null;
  readonly userAgent: string | null;
  readonly createdAt: Date;
}

export class ConsentEntity {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly invitationId: string,
    public readonly consentTextId: string | null,
    public readonly consentText: string | null,
    public readonly acceptedAt: Date,
    public readonly ip: string | null,
    public readonly userAgent: string | null,
    public readonly createdAt: Date
  ) {}

  static create(params: {
    projectId: string;
    invitationId: string;
    consentTextId?: string | null;
    consentText?: string | null;
    ip?: string | null;
    userAgent?: string | null;
  }): ConsentEntity {
    const now = new Date();
    return new ConsentEntity(
      this.generateId(),
      params.projectId,
      params.invitationId,
      params.consentTextId ?? null,
      params.consentText ?? null,
      now,
      params.ip ?? null,
      params.userAgent ?? null,
      now
    );
  }

  static fromData(data: Consent): ConsentEntity {
    return new ConsentEntity(
      data.id,
      data.projectId,
      data.invitationId,
      data.consentTextId,
      data.consentText,
      data.acceptedAt,
      data.ip,
      data.userAgent,
      data.createdAt
    );
  }

  toData(): Consent {
    return {
      id: this.id,
      projectId: this.projectId,
      invitationId: this.invitationId,
      consentTextId: this.consentTextId,
      consentText: this.consentText,
      acceptedAt: this.acceptedAt,
      ip: this.ip,
      userAgent: this.userAgent,
      createdAt: this.createdAt,
    };
  }

  private static generateId(): string {
    return randomUUID();
  }
}
