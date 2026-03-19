import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { AudioTranscriptionRepositoryPort } from '../ports/audio-transcription-repository.port';
import type { AudioTranscriptionError } from '../../domain/errors/audio-transcription.error';
import type { TranscriptionInsightsData } from '../../domain/entities/project-transcription.entity';

@injectable()
export class GenerateTranscriptionInsightsUseCase {
  constructor(
    @inject(TYPES.AudioTranscriptionRepository)
    private readonly _repository: AudioTranscriptionRepositoryPort
  ) {}

  execute(projectId: string): Promise<Result<TranscriptionInsightsData, AudioTranscriptionError>> {
    return this._repository.generateInsights(projectId);
  }
}
