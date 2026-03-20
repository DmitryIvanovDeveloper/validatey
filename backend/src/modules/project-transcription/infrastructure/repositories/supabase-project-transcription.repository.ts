import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectTranscriptionEntity } from '../../domain/entities/project-transcription.entity';
import type { TranscriptionInsightsOutput } from '../../application/ports/transcription-insights-llm.port';
import {
  ProjectTranscriptionNotFoundError,
  TranscriptionInsightsPersistenceError,
  TranscriptionPersistenceError,
} from '../../domain/errors/transcription.error';
import type {
  CreateProjectTranscriptionInput,
  DeleteProjectTranscriptionInput,
  ProjectTranscriptionRepositoryPort,
  SaveProjectTranscriptionInsightsInput,
} from '../../application/ports/project-transcription-repository.port';

interface TranscriptionRow {
  id: string;
  project_id: string;
  user_id: string;
  transcript: string;
  original_filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  language: string | null;
  created_at: string;
}

interface InsightsRow {
  summary: string;
  insights: string[] | null;
  themes: string[] | null;
  risks: string[] | null;
  next_actions: string[] | null;
  generated_at: string | null;
}

@injectable()
export class SupabaseProjectTranscriptionRepository implements ProjectTranscriptionRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(
    input: CreateProjectTranscriptionInput
  ): Promise<ResultEx<ProjectTranscriptionEntity, TranscriptionPersistenceError>> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('project_transcriptions')
        .insert({
          project_id: input.projectId,
          user_id: input.userId,
          transcript: input.transcript,
          original_filename: input.originalFilename ?? null,
          mime_type: input.mimeType ?? null,
          size_bytes: input.sizeBytes ?? null,
          language: input.language ?? null,
        })
        .select()
        .single();

      if (error || !data) {
        this._logger.error('supabase-project-transcription.create-error', { error });
        return ResultEx.failure(
          new TranscriptionPersistenceError(error?.message || 'Failed to save transcription')
        );
      }

      return ResultEx.success(ProjectTranscriptionEntity.fromRow(data as TranscriptionRow));
    } catch (e) {
      this._logger.error('supabase-project-transcription.create-exception', { error: e });
      return ResultEx.failure(
        new TranscriptionPersistenceError(e instanceof Error ? e.message : 'Unknown error')
      );
    }
  }

  async existsByProjectAndFile(
    projectId: string,
    originalFilename: string,
    sizeBytes?: number
  ): Promise<ResultEx<boolean, TranscriptionPersistenceError>> {
    try {
      const normalizedFilename = (originalFilename || '').trim();
      if (!normalizedFilename) return ResultEx.success(false);

      let query = getSupabaseClient()
        .from('project_transcriptions')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .ilike('original_filename', normalizedFilename);

      if (typeof sizeBytes === 'number' && sizeBytes > 0) {
        query = query.eq('size_bytes', sizeBytes);
      }

      const { count, error } = await query;
      if (error) {
        this._logger.error('supabase-project-transcription.exists-error', { error, projectId, originalFilename, sizeBytes });
        return ResultEx.failure(new TranscriptionPersistenceError(error.message));
      }
      return ResultEx.success((count || 0) > 0);
    } catch (e) {
      this._logger.error('supabase-project-transcription.exists-exception', { error: e, projectId, originalFilename, sizeBytes });
      return ResultEx.failure(
        new TranscriptionPersistenceError(e instanceof Error ? e.message : 'Unknown error')
      );
    }
  }

  async listByProjectId(
    projectId: string,
    limit = 50,
    offset = 0
  ): Promise<ResultEx<ProjectTranscriptionEntity[], TranscriptionPersistenceError>> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('project_transcriptions')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        this._logger.error('supabase-project-transcription.list-error', { error });
        return ResultEx.failure(new TranscriptionPersistenceError(error.message));
      }

      const rows = (data || []) as TranscriptionRow[];
      return ResultEx.success(rows.map((r) => ProjectTranscriptionEntity.fromRow(r)));
    } catch (e) {
      this._logger.error('supabase-project-transcription.list-exception', { error: e });
      return ResultEx.failure(
        new TranscriptionPersistenceError(e instanceof Error ? e.message : 'Unknown error')
      );
    }
  }

  async deleteById(
    input: DeleteProjectTranscriptionInput
  ): Promise<ResultEx<void, TranscriptionPersistenceError | ProjectTranscriptionNotFoundError>> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('project_transcriptions')
        .delete()
        .match({
          id: input.id,
          project_id: input.projectId,
          user_id: input.userId,
        })
        .select('id');

      if (error) {
        this._logger.error('supabase-project-transcription.delete-error', { error });
        return ResultEx.failure(new TranscriptionPersistenceError(error.message));
      }

      const deleted = Array.isArray(data) ? data.length : 0;
      if (deleted === 0) {
        return ResultEx.failure(new ProjectTranscriptionNotFoundError(input.id));
      }

      return ResultEx.success(undefined);
    } catch (e) {
      this._logger.error('supabase-project-transcription.delete-exception', { error: e });
      return ResultEx.failure(
        new TranscriptionPersistenceError(e instanceof Error ? e.message : 'Unknown error')
      );
    }
  }

  async saveInsights(
    input: SaveProjectTranscriptionInsightsInput
  ): Promise<ResultEx<TranscriptionInsightsOutput, TranscriptionInsightsPersistenceError>> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('project_transcription_insights')
        .upsert(
          {
            project_id: input.projectId,
            user_id: input.userId,
            summary: input.payload.summary,
            insights: input.payload.insights,
            themes: input.payload.themes,
            risks: input.payload.risks,
            next_actions: input.payload.nextActions,
            generated_at: input.payload.generatedAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'project_id' }
        )
        .select('summary, insights, themes, risks, next_actions, generated_at')
        .single();

      if (error || !data) {
        this._logger.error('supabase-project-transcription.save-insights-error', { error });
        return ResultEx.failure(
          new TranscriptionInsightsPersistenceError(error?.message || 'Failed to save transcription insights')
        );
      }

      const row = data as InsightsRow;
      return ResultEx.success({
        summary: row.summary,
        insights: row.insights ?? [],
        themes: row.themes ?? [],
        risks: row.risks ?? [],
        nextActions: row.next_actions ?? [],
        generatedAt: row.generated_at ?? new Date().toISOString(),
      });
    } catch (e) {
      this._logger.error('supabase-project-transcription.save-insights-exception', { error: e });
      return ResultEx.failure(
        new TranscriptionInsightsPersistenceError(e instanceof Error ? e.message : 'Unknown error')
      );
    }
  }

  async getInsightsByProjectId(
    projectId: string
  ): Promise<ResultEx<TranscriptionInsightsOutput | null, TranscriptionInsightsPersistenceError>> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('project_transcription_insights')
        .select('summary, insights, themes, risks, next_actions, generated_at')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) {
        this._logger.error('supabase-project-transcription.get-insights-error', { error, projectId });
        return ResultEx.failure(new TranscriptionInsightsPersistenceError(error.message));
      }
      if (!data) return ResultEx.success(null);

      const row = data as InsightsRow;
      return ResultEx.success({
        summary: row.summary,
        insights: row.insights ?? [],
        themes: row.themes ?? [],
        risks: row.risks ?? [],
        nextActions: row.next_actions ?? [],
        generatedAt: row.generated_at ?? new Date().toISOString(),
      });
    } catch (e) {
      this._logger.error('supabase-project-transcription.get-insights-exception', { error: e, projectId });
      return ResultEx.failure(
        new TranscriptionInsightsPersistenceError(e instanceof Error ? e.message : 'Unknown error')
      );
    }
  }
}
