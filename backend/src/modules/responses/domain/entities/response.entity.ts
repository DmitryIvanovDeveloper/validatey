import { randomUUID } from 'crypto';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface Response {
  readonly id: string;
  readonly invitationId: string;
  readonly projectId: string;
  readonly answers: Record<string, any>;
  readonly audioUrl: string | null;
  readonly transcript: string | null;
  /** For public-link responses: pending | approved | rejected. Null for personal invitations. */
  readonly moderationStatus: ModerationStatus | null;
  readonly questionLabels: Record<string, string>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class ResponseEntity {
  private constructor(
    public readonly id: string,
    public readonly invitationId: string,
    public readonly projectId: string,
    public readonly answers: Record<string, any>,
    public readonly audioUrl: string | null,
    public readonly transcript: string | null,
    public readonly moderationStatus: ModerationStatus | null,
    public readonly questionLabels: Record<string, string>,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    invitationId: string,
    projectId: string,
    answers: Record<string, any>,
    audioUrl?: string,
    moderationStatus?: ModerationStatus | null,
    questionLabels?: Record<string, string>
  ): ResponseEntity {
    if (!answers || Object.keys(answers).length === 0) {
      throw new Error('Response answers are required');
    }

    const now = new Date();
    return new ResponseEntity(
      this.generateId(),
      invitationId,
      projectId,
      answers,
      audioUrl || null,
      null,
      moderationStatus ?? null,
      questionLabels ?? {},
      now,
      now
    );
  }

  static fromData(data: Response): ResponseEntity {
    return new ResponseEntity(
      data.id,
      data.invitationId,
      data.projectId,
      data.answers,
      data.audioUrl,
      data.transcript,
      data.moderationStatus ?? null,
      data.questionLabels,
      data.createdAt,
      data.updatedAt
    );
  }

  withTranscript(transcript: string): ResponseEntity {
    return new ResponseEntity(
      this.id,
      this.invitationId,
      this.projectId,
      this.answers,
      this.audioUrl,
      transcript,
      this.moderationStatus,
      this.questionLabels,
      this.createdAt,
      new Date()
    );
  }

  withModerationStatus(status: ModerationStatus): ResponseEntity {
    if (this.moderationStatus !== 'pending' && this.moderationStatus !== null) {
      throw new Error('Only pending responses can be moderated');
    }
    if (status !== 'approved' && status !== 'rejected') {
      throw new Error('Moderation status must be approved or rejected');
    }
    return new ResponseEntity(
      this.id,
      this.invitationId,
      this.projectId,
      this.answers,
      this.audioUrl,
      this.transcript,
      status,
      this.questionLabels,
      this.createdAt,
      new Date()
    );
  }

  toData(): Response {
    return {
      id: this.id,
      invitationId: this.invitationId,
      projectId: this.projectId,
      answers: this.answers,
      audioUrl: this.audioUrl,
      transcript: this.transcript,
      moderationStatus: this.moderationStatus,
      questionLabels: this.questionLabels,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    // Generate UUID v4 using Node.js crypto.randomUUID() for database compatibility
    return randomUUID();
  }
}



