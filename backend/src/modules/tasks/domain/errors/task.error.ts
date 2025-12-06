export class TaskError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskError';
  }
}

export class TaskNotFoundError extends TaskError {
  constructor(taskId: string) {
    super(`Task with id ${taskId} not found`);
    this.name = 'TaskNotFoundError';
  }
}

export class InvalidTaskDataError extends TaskError {
  constructor(message: string) {
    super(`Invalid task data: ${message}`);
    this.name = 'InvalidTaskDataError';
  }
}

export class TaskProcessingError extends TaskError {
  constructor(message: string) {
    super(`Task processing failed: ${message}`);
    this.name = 'TaskProcessingError';
  }
}

export class MaxRetriesExceededError extends TaskError {
  constructor(taskId: string) {
    super(`Task ${taskId} exceeded maximum retries`);
    this.name = 'MaxRetriesExceededError';
  }
}

