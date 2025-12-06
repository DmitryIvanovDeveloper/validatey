import ResultEx from '../../../../infrastructure/result/result';
import { AudioProcessingError } from '../../domain/errors/response.error';

export interface TranscribeAudioRequest {
  audioUrl: string;
  language?: string;
}

export interface TranscribeAudioResponse {
  transcript: string;
  confidence?: number;
}

export interface TranscriptionServicePort {
  transcribe(request: TranscribeAudioRequest): Promise<ResultEx<TranscribeAudioResponse, AudioProcessingError>>;
}

