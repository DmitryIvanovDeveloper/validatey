import { TaskType } from '../../../domain/entities/task.entity';

export type CreateTaskUseCaseRequest = {
  type: TaskType;
  payload: Record<string, any>;
  maxRetries?: number;
  deadline?: Date;
};

export type CreateTaskUseCaseResponse = {
  task: {
    id: string;
    type: TaskType;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    payload: Record<string, any>;
    result: Record<string, any> | null;
    errorMessage: string | null;
    retryCount: number;
    maxRetries: number;
    deadline: Date | null;
    startedAt: Date | null;
    completedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};


