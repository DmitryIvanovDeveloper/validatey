import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import type { AudioTranscriptionRepositoryPort } from '../../application/ports/audio-transcription-repository.port';
import {
  ProjectTranscriptionEntity,
  type TranscribeApiResponse,
  type TranscriptionInsightsData,
} from '../../domain/entities/project-transcription.entity';
import { AudioTranscriptionError } from '../../domain/errors/audio-transcription.error';

@injectable()
export class HttpAudioTranscriptionRepository implements AudioTranscriptionRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async transcribe(
    projectId: string,
    file: File,
    language?: string
  ): Promise<Result<TranscribeApiResponse, AudioTranscriptionError>> {
    try {
      const form = new FormData();
      form.append('audio', file);
      if (language?.trim()) {
        form.append('language', language.trim());
      }
      const url = API_CONFIG.ENDPOINTS.PROJECT_TRANSCRIPTIONS(projectId);
      const raw = await this._http.post<TranscribeApiResponse>(url, form);
      if (!raw?.id || typeof raw.transcript !== 'string') {
        return Result.failure(new AudioTranscriptionError('Invalid transcription response'));
      }
      return Result.success(raw);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transcription failed';
      return Result.failure(new AudioTranscriptionError(msg));
    }
  }

  async list(projectId: string): Promise<Result<ProjectTranscriptionEntity[], AudioTranscriptionError>> {
    try {
      const url = API_CONFIG.ENDPOINTS.PROJECT_TRANSCRIPTIONS(projectId);
      const raw = await this._http.get<{ items: Record<string, unknown>[] }>(url);
      const items = Array.isArray(raw?.items) ? raw.items : [];
      return Result.success(items.map((row) => ProjectTranscriptionEntity.fromApi(row)));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load history';
      return Result.failure(new AudioTranscriptionError(msg));
    }
  }

  async delete(projectId: string, transcriptionId: string): Promise<Result<void, AudioTranscriptionError>> {
    try {
      const url = API_CONFIG.ENDPOINTS.PROJECT_TRANSCRIPTION_BY_ID(projectId, transcriptionId);
      await this._http.delete<void>(url);
      return Result.success(undefined);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete transcript';
      return Result.failure(new AudioTranscriptionError(msg));
    }
  }

  async generateInsights(projectId: string): Promise<Result<TranscriptionInsightsData, AudioTranscriptionError>> {
    try {
      const url = API_CONFIG.ENDPOINTS.PROJECT_TRANSCRIPTION_INSIGHTS(projectId);
      const raw = await this._http.post<TranscriptionInsightsData>(url, {});
      if (!raw || typeof raw.summary !== 'string') {
        return Result.failure(new AudioTranscriptionError('Invalid insights response'));
      }
      return Result.success({
        summary: raw.summary,
        insights: Array.isArray(raw.insights) ? raw.insights : [],
        themes: Array.isArray(raw.themes) ? raw.themes : [],
        risks: Array.isArray(raw.risks) ? raw.risks : [],
        nextActions: Array.isArray(raw.nextActions) ? raw.nextActions : [],
        generatedAt: String(raw.generatedAt ?? new Date().toISOString()),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate insights';
      return Result.failure(new AudioTranscriptionError(msg));
    }
  }

  async getInsights(projectId: string): Promise<Result<TranscriptionInsightsData | null, AudioTranscriptionError>> {
    try {
      const url = API_CONFIG.ENDPOINTS.PROJECT_TRANSCRIPTION_INSIGHTS(projectId);
      const raw = await this._http.get<TranscriptionInsightsData | null>(url);
      if (!raw) return Result.success(null);
      if (typeof raw.summary !== 'string') {
        return Result.failure(new AudioTranscriptionError('Invalid insights response'));
      }
      return Result.success({
        summary: raw.summary,
        insights: Array.isArray(raw.insights) ? raw.insights : [],
        themes: Array.isArray(raw.themes) ? raw.themes : [],
        risks: Array.isArray(raw.risks) ? raw.risks : [],
        nextActions: Array.isArray(raw.nextActions) ? raw.nextActions : [],
        generatedAt: String(raw.generatedAt ?? new Date().toISOString()),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load insights';
      return Result.failure(new AudioTranscriptionError(msg));
    }
  }
}
