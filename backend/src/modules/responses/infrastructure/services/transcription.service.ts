import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TranscriptionServicePort, TranscribeAudioRequest, TranscribeAudioResponse } from '../../application/ports/transcription-service.port';
import { AudioProcessingError } from '../../domain/errors/response.error';

@injectable()
export class TranscriptionService implements TranscriptionServicePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async transcribe(request: TranscribeAudioRequest): Promise<ResultEx<TranscribeAudioResponse, AudioProcessingError>> {
    this._logger.info('transcription-service.transcribe.start', { audioUrl: request.audioUrl.substring(0, 50) + '...' });

    try {
      // TODO: Integrate with actual transcription service (OpenAI Whisper, Google Speech-to-Text, etc.)
      // For now, return placeholder
      this._logger.warn('transcription-service.transcribe.not-implemented', { audioUrl: request.audioUrl });

      return ResultEx.failure(new AudioProcessingError('Transcription service not implemented yet'));
    } catch (error) {
      this._logger.error('transcription-service.transcribe.error', { error });
      return ResultEx.failure(
        new AudioProcessingError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }
}


