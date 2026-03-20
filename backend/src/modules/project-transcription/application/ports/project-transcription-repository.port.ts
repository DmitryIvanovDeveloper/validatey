import ResultEx from '../../../../infrastructure/result/result';
import { ProjectTranscriptionEntity } from '../../domain/entities/project-transcription.entity';
import type { TranscriptionInsightsOutput } from './transcription-insights-llm.port';
import {
  ProjectTranscriptionNotFoundError,
  TranscriptionInsightsPersistenceError,
  TranscriptionPersistenceError,
} from '../../domain/errors/transcription.error';

export interface CreateProjectTranscriptionInput {
  projectId: string;
  userId: string;
  transcript: string;
  originalFilename?: string;
  mimeType?: string;
  sizeBytes?: number;
  language?: string;
}

export interface DeleteProjectTranscriptionInput {
  id: string;
  projectId: string;
  userId: string;
}

export interface SaveProjectTranscriptionInsightsInput {
  projectId: string;
  userId: string;
  payload: TranscriptionInsightsOutput;
}

export interface ProjectTranscriptionRepositoryPort {
  create(input: CreateProjectTranscriptionInput): Promise<ResultEx<ProjectTranscriptionEntity, TranscriptionPersistenceError>>;
  existsByProjectAndFile(
    projectId: string,
    originalFilename: string,
    sizeBytes?: number
  ): Promise<ResultEx<boolean, TranscriptionPersistenceError>>;
  listByProjectId(projectId: string, limit?: number, offset?: number): Promise<ResultEx<ProjectTranscriptionEntity[], TranscriptionPersistenceError>>;
  deleteById(
    input: DeleteProjectTranscriptionInput
  ): Promise<ResultEx<void, TranscriptionPersistenceError | ProjectTranscriptionNotFoundError>>;
  saveInsights(
    input: SaveProjectTranscriptionInsightsInput
  ): Promise<ResultEx<TranscriptionInsightsOutput, TranscriptionInsightsPersistenceError>>;
  getInsightsByProjectId(
    projectId: string
  ): Promise<ResultEx<TranscriptionInsightsOutput | null, TranscriptionInsightsPersistenceError>>;
}
