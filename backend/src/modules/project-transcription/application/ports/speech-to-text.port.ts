import ResultEx from '../../../../infrastructure/result/result';
import { SpeechToTextProviderError } from '../../domain/errors/transcription.error';

export interface TranscribeFromBufferInput {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  language?: string;
}

export interface TranscribeFromBufferOutput {
  text: string;
  language?: string;
}

export interface SpeechToTextPort {
  transcribeFromBuffer(input: TranscribeFromBufferInput): Promise<ResultEx<TranscribeFromBufferOutput, SpeechToTextProviderError>>;
}
