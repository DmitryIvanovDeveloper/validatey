import type { Response } from '../../domain/entities/response.entity';
import type { ModerationStatus } from '../../domain/entities/response.entity';

export interface GetResponsesOptions {
  limit?: number;
  offset?: number;
  searchText?: string;
  sortBy?: 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ResponseRepositoryPort {
  getByProjectId(projectId: string, options?: GetResponsesOptions): Promise<{ responses: Response[]; total: number; error?: string }>;
  getById(responseId: string): Promise<{ response: Response | null; error?: string }>;
  moderate(responseId: string, status: ModerationStatus): Promise<{ success: boolean; error?: string }>;
  getPendingForModeration(projectId: string): Promise<{ responses: Response[]; error?: string }>;
}