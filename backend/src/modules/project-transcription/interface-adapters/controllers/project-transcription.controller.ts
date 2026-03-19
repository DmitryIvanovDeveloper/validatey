import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TranscribeProjectAudioUseCase } from '../../application/use-cases/transcribe-project-audio.use-case';
import { ListProjectTranscriptsUseCase } from '../../application/use-cases/list-project-transcripts.use-case';
import { GetProjectTranscriptionInsightsUseCase } from '../../application/use-cases/get-project-transcription-insights.use-case';
import { DeleteProjectTranscriptionUseCase } from '../../application/use-cases/delete-project-transcription.use-case';
import { GenerateProjectTranscriptionInsightsUseCase } from '../../application/use-cases/generate-project-transcription-insights.use-case';

@injectable()
export class ProjectTranscriptionController {
  constructor(
    @inject(TYPES.TranscribeProjectAudioUseCase)
    private readonly _transcribe: TranscribeProjectAudioUseCase,
    @inject(TYPES.ListProjectTranscriptsUseCase)
    private readonly _list: ListProjectTranscriptsUseCase,
    @inject(TYPES.GetProjectTranscriptionInsightsUseCase)
    private readonly _getInsights: GetProjectTranscriptionInsightsUseCase,
    @inject(TYPES.DeleteProjectTranscriptionUseCase)
    private readonly _delete: DeleteProjectTranscriptionUseCase,
    @inject(TYPES.GenerateProjectTranscriptionInsightsUseCase)
    private readonly _insights: GenerateProjectTranscriptionInsightsUseCase
  ) {}

  transcribe(input: {
    projectId: string;
    userId: string;
    buffer: Buffer;
    mimeType: string;
    originalFilename: string;
    language?: string;
  }) {
    return this._transcribe.execute(input);
  }

  list(input: { projectId: string; userId: string; limit?: number; offset?: number }) {
    return this._list.execute(input);
  }

  getInsights(input: { projectId: string; userId: string }) {
    return this._getInsights.execute(input);
  }

  delete(input: { projectId: string; userId: string; transcriptionId: string }) {
    return this._delete.execute(input);
  }

  generateInsights(input: { projectId: string; userId: string }) {
    return this._insights.execute(input);
  }
}
