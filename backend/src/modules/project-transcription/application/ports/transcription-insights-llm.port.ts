import ResultEx from '../../../../infrastructure/result/result';
import { TranscriptionInsightsGenerationError } from '../../domain/errors/transcription.error';

export interface TranscriptHistoryItem {
  id: string;
  originalFilename: string | null;
  createdAtIso: string;
  transcript: string;
  language: string | null;
}

export interface GenerateTranscriptionInsightsInput {
  projectId: string;
  history: TranscriptHistoryItem[];
}

export interface TranscriptionInsightsOutput {
  summary: string;
  insights: string[];
  themes: string[];
  risks: string[];
  nextActions: string[];
  generatedAt: string;
}

export interface TranscriptionInsightsLlmPort {
  generateInsights(
    input: GenerateTranscriptionInsightsInput
  ): Promise<ResultEx<TranscriptionInsightsOutput, TranscriptionInsightsGenerationError>>;
}
