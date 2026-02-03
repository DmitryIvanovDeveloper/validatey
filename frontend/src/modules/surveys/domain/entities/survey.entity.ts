import { SurveyQuestion } from '../value-objects/survey-question.vo';

export type SurveyStatus = 'pending' | 'started' | 'completed' | 'expired';

export class Survey {
  constructor(
    public readonly id: string,
    public readonly token: string,
    public readonly projectId: string,
    public readonly questions: SurveyQuestion[],
    public readonly status: SurveyStatus,
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Survey id cannot be empty');
    }
    if (!token || token.trim().length === 0) {
      throw new Error('Survey token cannot be empty');
    }
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Survey projectId cannot be empty');
    }
  }

  start(): Survey {
    if (this.status !== 'pending') {
      throw new Error('Survey can only be started from pending status');
    }
    return new Survey(
      this.id,
      this.token,
      this.projectId,
      this.questions,
      'started',
      new Date(),
      this.completedAt
    );
  }

  complete(): Survey {
    if (this.status !== 'started') {
      throw new Error('Survey can only be completed from started status');
    }
    return new Survey(
      this.id,
      this.token,
      this.projectId,
      this.questions,
      'completed',
      this.startedAt,
      new Date()
    );
  }

  addAnswer(questionId: string): Survey {
    // Immutable method - returns new instance
    // In practice, answers are stored separately in survey-responses module
    return this;
  }
}



