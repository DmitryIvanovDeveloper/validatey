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
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class ResponseEntity {
  constructor(
    public readonly id: string,
    public readonly invitationId: string,
    public readonly projectId: string,
    public readonly answers: Record<string, any>,
    public readonly audioUrl: string | null,
    public readonly transcript: string | null,
    public readonly moderationStatus: ModerationStatus | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromData(data: Response): ResponseEntity {
    return new ResponseEntity(
      data.id,
      data.invitationId,
      data.projectId,
      data.answers,
      data.audioUrl,
      data.transcript,
      data.moderationStatus ?? null,
      data.createdAt,
      data.updatedAt
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
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}