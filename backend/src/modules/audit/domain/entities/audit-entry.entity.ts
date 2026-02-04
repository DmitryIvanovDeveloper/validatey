import { randomUUID } from 'crypto';

export interface AuditEntry {
  readonly id: string;
  readonly userId: string | null;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string | null;
  readonly timestamp: Date;
  readonly ip: string | null;
  readonly userAgent: string | null;
  readonly metadata: Record<string, unknown> | null;
}

export class AuditEntryEntity {
  private constructor(
    public readonly id: string,
    public readonly userId: string | null,
    public readonly action: string,
    public readonly resourceType: string,
    public readonly resourceId: string | null,
    public readonly timestamp: Date,
    public readonly ip: string | null,
    public readonly userAgent: string | null,
    public readonly metadata: Record<string, unknown> | null
  ) {}

  static create(params: {
    userId?: string | null;
    action: string;
    resourceType: string;
    resourceId?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown> | null;
  }): AuditEntryEntity {
    const now = new Date();
    return new AuditEntryEntity(
      this.generateId(),
      params.userId ?? null,
      params.action,
      params.resourceType,
      params.resourceId ?? null,
      now,
      params.ip ?? null,
      params.userAgent ?? null,
      params.metadata ?? null
    );
  }

  static fromData(data: AuditEntry): AuditEntryEntity {
    return new AuditEntryEntity(
      data.id,
      data.userId,
      data.action,
      data.resourceType,
      data.resourceId,
      data.timestamp,
      data.ip,
      data.userAgent,
      data.metadata
    );
  }

  toData(): AuditEntry {
    return {
      id: this.id,
      userId: this.userId,
      action: this.action,
      resourceType: this.resourceType,
      resourceId: this.resourceId,
      timestamp: this.timestamp,
      ip: this.ip,
      userAgent: this.userAgent,
      metadata: this.metadata,
    };
  }

  private static generateId(): string {
    return randomUUID();
  }
}
