import { randomUUID } from 'crypto';

export type DeletionRequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface DeletionRequest {
  readonly id: string;
  readonly projectId: string;
  /** Email or other identifier of the person requesting deletion */
  readonly identifier: string;
  readonly status: DeletionRequestStatus;
  readonly requestedAt: Date;
  readonly completedAt: Date | null;
  readonly requestedBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class DeletionRequestEntity {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly identifier: string,
    public readonly status: DeletionRequestStatus,
    public readonly requestedAt: Date,
    public readonly completedAt: Date | null,
    public readonly requestedBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(projectId: string, identifier: string, requestedBy?: string | null): DeletionRequestEntity {
    const now = new Date();
    return new DeletionRequestEntity(
      this.generateId(),
      projectId,
      identifier.trim(),
      'pending',
      now,
      null,
      requestedBy ?? null,
      now,
      now
    );
  }

  static fromData(data: DeletionRequest): DeletionRequestEntity {
    return new DeletionRequestEntity(
      data.id,
      data.projectId,
      data.identifier,
      data.status,
      data.requestedAt,
      data.completedAt,
      data.requestedBy,
      data.createdAt,
      data.updatedAt
    );
  }

  withStatus(status: DeletionRequestStatus): DeletionRequestEntity {
    const completedAt = status === 'completed' || status === 'rejected' ? new Date() : this.completedAt;
    return new DeletionRequestEntity(
      this.id,
      this.projectId,
      this.identifier,
      status,
      this.requestedAt,
      completedAt,
      this.requestedBy,
      this.createdAt,
      new Date()
    );
  }

  toData(): DeletionRequest {
    return {
      id: this.id,
      projectId: this.projectId,
      identifier: this.identifier,
      status: this.status,
      requestedAt: this.requestedAt,
      completedAt: this.completedAt,
      requestedBy: this.requestedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    return randomUUID();
  }
}
