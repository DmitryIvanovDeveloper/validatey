import Result from '../../../../infrastructure/result/result';
import type {
  ProjectTranscriptionEntity,
  TranscribeApiResponse,
  TranscriptionInsightsData,
} from '../../domain/entities/project-transcription.entity';
import type { AudioTranscriptionError } from '../../domain/errors/audio-transcription.error';

export interface AudioTranscriptionRepositoryPort {
  transcribe(
    projectId: string,
    file: File,
    language?: string
  ): Promise<Result<TranscribeApiResponse, AudioTranscriptionError>>;

  list(projectId: string): Promise<Result<ProjectTranscriptionEntity[], AudioTranscriptionError>>;

  delete(projectId: string, transcriptionId: string): Promise<Result<void, AudioTranscriptionError>>;

  generateInsights(projectId: string): Promise<Result<TranscriptionInsightsData, AudioTranscriptionError>>;

  getInsights(projectId: string): Promise<Result<TranscriptionInsightsData | null, AudioTranscriptionError>>;
}
