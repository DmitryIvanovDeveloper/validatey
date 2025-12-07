export type TaskType =
  | 'scenario-generation'
  | 'invitation-send'
  | 'response-process'
  | 'report-build'
  | 'metrics-calculate';

export class TaskTypeVO {
  private constructor(private readonly _value: TaskType) {}

  static create(value: string): TaskTypeVO {
    const validTypes: TaskType[] = [
      'scenario-generation',
      'invitation-send',
      'response-process',
      'report-build',
      'metrics-calculate',
    ];

    if (!validTypes.includes(value as TaskType)) {
      throw new Error(`Invalid task type: ${value}. Valid types: ${validTypes.join(', ')}`);
    }

    return new TaskTypeVO(value as TaskType);
  }

  get value(): TaskType {
    return this._value;
  }

  equals(other: TaskTypeVO): boolean {
    return this._value === other._value;
  }
}


