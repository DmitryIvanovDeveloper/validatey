import { injectable, inject } from 'inversify';
import { ref, computed } from 'vue';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectTranscriptionEntity } from '../../domain/entities/project-transcription.entity';
import type { TranscribeApiResponse, TranscriptionInsightsData } from '../../domain/entities/project-transcription.entity';
import { TranscribeAudioUseCase } from '../../application/use-cases/transcribe-audio.use-case';
import { ListTranscriptionsUseCase } from '../../application/use-cases/list-transcriptions.use-case';
import { DeleteTranscriptionUseCase } from '../../application/use-cases/delete-transcription.use-case';
import { GenerateTranscriptionInsightsUseCase } from '../../application/use-cases/generate-transcription-insights.use-case';
import { GetTranscriptionInsightsUseCase } from '../../application/use-cases/get-transcription-insights.use-case';

@injectable()
export class AudioTranscriptionPresenter {
  private readonly _loading = ref(false);
  private readonly _listing = ref(false);
  private readonly _error = ref<string | null>(null);
  private readonly _lastResult = ref<TranscribeApiResponse | null>(null);
  private readonly _history = ref<ProjectTranscriptionEntity[]>([]);
  private readonly _deletingId = ref<string | null>(null);
  private readonly _insightsLoading = ref(false);
  private readonly _insights = ref<TranscriptionInsightsData | null>(null);

  constructor(
    @inject(TYPES.TranscribeAudioUseCase)
    private readonly _transcribeUseCase: TranscribeAudioUseCase,
    @inject(TYPES.ListTranscriptionsUseCase)
    private readonly _listUseCase: ListTranscriptionsUseCase,
    @inject(TYPES.DeleteTranscriptionUseCase)
    private readonly _deleteUseCase: DeleteTranscriptionUseCase,
    @inject(TYPES.GenerateTranscriptionInsightsUseCase)
    private readonly _generateInsightsUseCase: GenerateTranscriptionInsightsUseCase,
    @inject(TYPES.GetTranscriptionInsightsUseCase)
    private readonly _getInsightsUseCase: GetTranscriptionInsightsUseCase
  ) {}

  get loading() {
    return computed(() => this._loading.value);
  }

  get listing() {
    return computed(() => this._listing.value);
  }

  get error() {
    return computed(() => this._error.value);
  }

  clearError(): void {
    this._error.value = null;
  }

  get lastResult() {
    return computed(() => this._lastResult.value);
  }

  get history() {
    return computed(() => this._history.value);
  }

  get deletingId() {
    return computed(() => this._deletingId.value);
  }

  get insightsLoading() {
    return computed(() => this._insightsLoading.value);
  }

  get insights() {
    return computed(() => this._insights.value);
  }

  async loadHistory(projectId: string): Promise<void> {
    this._listing.value = true;
    this._error.value = null;
    try {
      const result = await this._listUseCase.execute(projectId);
      if (!result.isSuccess) {
        this._error.value = result.error.message;
        return;
      }
      this._history.value = result.data;
      const insightsResult = await this._getInsightsUseCase.execute(projectId);
      if (insightsResult.isSuccess) {
        this._insights.value = insightsResult.data;
      }
    } finally {
      this._listing.value = false;
    }
  }

  async transcribe(projectId: string, file: File, language?: string): Promise<boolean> {
    this._loading.value = true;
    this._error.value = null;
    try {
      const result = await this._transcribeUseCase.execute(projectId, file, language);
      if (!result.isSuccess) {
        this._error.value = result.error.message;
        return false;
      }
      this._lastResult.value = result.data;
      await this.loadHistory(projectId);
      return true;
    } finally {
      this._loading.value = false;
    }
  }

  async deleteTranscription(projectId: string, transcriptionId: string): Promise<boolean> {
    this._deletingId.value = transcriptionId;
    this._error.value = null;
    try {
      const result = await this._deleteUseCase.execute(projectId, transcriptionId);
      if (!result.isSuccess) {
        this._error.value = result.error.message;
        return false;
      }
      if (this._lastResult.value?.id === transcriptionId) {
        this._lastResult.value = null;
      }
      await this.loadHistory(projectId);
      return true;
    } finally {
      this._deletingId.value = null;
    }
  }

  async generateInsights(projectId: string): Promise<boolean> {
    this._insightsLoading.value = true;
    this._error.value = null;
    try {
      const result = await this._generateInsightsUseCase.execute(projectId);
      if (!result.isSuccess) {
        this._error.value = result.error.message;
        return false;
      }
      this._insights.value = result.data;
      return true;
    } finally {
      this._insightsLoading.value = false;
    }
  }
}
