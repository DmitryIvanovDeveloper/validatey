export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type TaskType =
  | 'scenario-generation'
  | 'invitation-send'
  | 'response-process'
  | 'report-build'
  | 'metrics-calculate'
  | 'scraper-collect';

export interface Task {
  readonly id: string;
  readonly type: TaskType;
  readonly status: TaskStatus;
  readonly payload: Record<string, any>;
  readonly result: Record<string, any> | null;
  readonly errorMessage: string | null;
  readonly retryCount: number;
  readonly maxRetries: number;
  readonly deadline: Date | null;
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class TaskEntity {
  private constructor(
    public readonly id: string,
    public readonly type: TaskType,
    public readonly status: TaskStatus,
    public readonly payload: Record<string, any>,
    public readonly result: Record<string, any> | null,
    public readonly errorMessage: string | null,
    public readonly retryCount: number,
    public readonly maxRetries: number,
    public readonly deadline: Date | null,
    public readonly startedAt: Date | null,
    public readonly completedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    type: TaskType,
    payload: Record<string, any>,
    maxRetries: number = 3,
    deadline?: Date
  ): TaskEntity {
    if (!payload || Object.keys(payload).length === 0) {
      throw new Error('Task payload is required');
    }

    const now = new Date();
    return new TaskEntity(
      this.generateId(),
      type,
      'pending',
      payload,
      null,
      null,
      0,
      maxRetries,
      deadline || null,
      null,
      null,
      now,
      now
    );
  }

  static fromData(data: Task): TaskEntity {
    return new TaskEntity(
      data.id,
      data.type,
      data.status,
      data.payload,
      data.result,
      data.errorMessage,
      data.retryCount,
      data.maxRetries,
      data.deadline,
      data.startedAt,
      data.completedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  markAsProcessing(): TaskEntity {
    if (this.status !== 'pending') {
      throw new Error('Only pending tasks can be marked as processing');
    }
    return new TaskEntity(
      this.id,
      this.type,
      'processing',
      this.payload,
      this.result,
      this.errorMessage,
      this.retryCount,
      this.maxRetries,
      this.deadline,
      new Date(),
      this.completedAt,
      this.createdAt,
      new Date()
    );
  }

  markAsCompleted(result: Record<string, any>): TaskEntity {
    if (this.status !== 'processing') {
      throw new Error('Only processing tasks can be marked as completed');
    }
    return new TaskEntity(
      this.id,
      this.type,
      'completed',
      this.payload,
      result,
      null,
      this.retryCount,
      this.maxRetries,
      this.deadline,
      this.startedAt,
      new Date(),
      this.createdAt,
      new Date()
    );
  }

  markAsFailed(errorMessage: string): TaskEntity {
    if (this.status !== 'processing') {
      throw new Error('Only processing tasks can be marked as failed');
    }
    return new TaskEntity(
      this.id,
      this.type,
      'failed',
      this.payload,
      this.result,
      errorMessage,
      this.retryCount,
      this.maxRetries,
      this.deadline,
      this.startedAt,
      null,
      this.createdAt,
      new Date()
    );
  }

  incrementRetry(): TaskEntity {
    if (this.retryCount >= this.maxRetries) {
      throw new Error('Maximum retries exceeded');
    }
    return new TaskEntity(
      this.id,
      this.type,
      'pending',
      this.payload,
      this.result,
      null,
      this.retryCount + 1,
      this.maxRetries,
      this.deadline,
      null,
      null,
      this.createdAt,
      new Date()
    );
  }

  toData(): Task {
    return {
      id: this.id,
      type: this.type,
      status: this.status,
      payload: this.payload,
      result: this.result,
      errorMessage: this.errorMessage,
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      deadline: this.deadline,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}



