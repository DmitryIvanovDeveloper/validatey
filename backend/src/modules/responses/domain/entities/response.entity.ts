export interface Response {
  readonly id: string;
  readonly invitationId: string;
  readonly projectId: string;
  readonly answers: Record<string, any>;
  readonly audioUrl: string | null;
  readonly transcript: string | null;
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
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    invitationId: string,
    projectId: string,
    answers: Record<string, any>,
    audioUrl?: string
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
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    return `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}



