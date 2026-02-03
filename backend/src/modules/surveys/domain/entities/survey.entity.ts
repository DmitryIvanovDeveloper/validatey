export type SurveyStatus = 'pending' | 'started' | 'completed' | 'expired';
export type QuestionType = 'scale' | 'open' | 'audio';

export interface SurveyQuestion {
  readonly id: string;
  readonly type: QuestionType;
  readonly text: string;
  readonly required: boolean;
}

export interface Survey {
  readonly id: string;
  readonly token: string;
  readonly projectId: string;
  readonly invitationId: string;
  readonly questions: SurveyQuestion[];
  readonly status: SurveyStatus;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class SurveyEntity {
  private constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly projectId: string,
    public readonly invitationId: string,
    public readonly questions: SurveyQuestion[],
    public readonly status: SurveyStatus,
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    projectId: string,
    invitationId: string,
    token: string,
    questions: SurveyQuestion[]
  ): SurveyEntity {
    if (!projectId || !invitationId || !token) {
      throw new Error('Project ID, invitation ID, and token are required');
    }
    if (!questions || questions.length === 0) {
      throw new Error('At least one question is required');
    }

    const now = new Date();
    return new SurveyEntity(
      this.generateId(),
      token,
      projectId,
      invitationId,
      questions,
      'pending',
      null,
      null,
      now,
      now
    );
  }

  static fromData(data: Survey): SurveyEntity {
    return new SurveyEntity(
      data.id,
      data.token,
      data.projectId,
      data.invitationId,
      data.questions,
      data.status,
      data.startedAt,
      data.completedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  markAsStarted(): SurveyEntity {
    if (this.status !== 'pending') {
      throw new Error('Only pending surveys can be marked as started');
    }
    return new SurveyEntity(
      this.id,
      this.token,
      this.projectId,
      this.invitationId,
      this.questions,
      'started',
      new Date(),
      this.completedAt,
      this.createdAt,
      new Date()
    );
  }

  markAsCompleted(): SurveyEntity {
    if (this.status === 'completed') {
      return this;
    }
    return new SurveyEntity(
      this.id,
      this.token,
      this.projectId,
      this.invitationId,
      this.questions,
      'completed',
      this.startedAt || new Date(),
      new Date(),
      this.createdAt,
      new Date()
    );
  }

  toData(): Survey {
    return {
      id: this.id,
      token: this.token,
      projectId: this.projectId,
      invitationId: this.invitationId,
      questions: this.questions,
      status: this.status,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    return `surv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}



