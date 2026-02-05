import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Response } from '../../domain/entities/response.entity';
import type { ModerationStatus } from '../../domain/entities/response.entity';
import { ResponseNotFoundError, InvalidResponseDataError } from '../../domain/errors/response.error';
import { ResponseRepositoryPort } from '../../application/ports/response-repository.port';

@injectable()
export class SupabaseResponseRepository implements ResponseRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(response: Response): Promise<ResultEx<Response, InvalidResponseDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('responses')
        .insert({
          id: response.id,
          invitation_id: response.invitationId,
          project_id: response.projectId,
          answers: response.answers,
          audio_url: response.audioUrl,
          transcript: response.transcript,
          moderation_status: response.moderationStatus ?? null,
          created_at: response.createdAt.toISOString(),
          updated_at: response.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-response-repository.create-error', { error });
        return ResultEx.failure(new InvalidResponseDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-response-repository.create-exception', { error });
      return ResultEx.failure(
        new InvalidResponseDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Response, ResponseNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('responses').select('*').eq('id', id).single();

      if (error || !data) {
        this._logger.error('supabase-response-repository.find-by-id-error', { id, error });
        return ResultEx.failure(new ResponseNotFoundError(id));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-response-repository.find-by-id-exception', { id, error });
      return ResultEx.failure(new ResponseNotFoundError(id));
    }
  }

  async findByInvitationId(invitationId: string): Promise<ResultEx<Response | null, Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('responses').select('*').eq('invitation_id', invitationId).single();

      if (error) {
        if (error.code === 'PGRST116') {
          return ResultEx.success(null);
        }
        this._logger.error('supabase-response-repository.find-by-invitation-id-error', { invitationId, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data ? this.mapToDomain(data) : null);
    } catch (error) {
      this._logger.error('supabase-response-repository.find-by-invitation-id-exception', { invitationId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<Response[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('supabase-response-repository.find-by-project-id-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success((data ?? []).map((item) => this.mapToDomain(item)));
    } catch (error) {
      this._logger.error('supabase-response-repository.find-by-project-id-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async listByProjectId(
    projectId: string,
    filters?: { moderationStatus?: ModerationStatus | null }
  ): Promise<ResultEx<Response[], Error>> {
    try {
      const supabase = getSupabaseClient();
      let query = supabase
        .from('responses')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (filters?.moderationStatus != null) {
        query = query.eq('moderation_status', filters.moderationStatus);
      }
      const { data, error } = await query;
      if (error) {
        this._logger.error('supabase-response-repository.list-by-project-id-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success((data ?? []).map((item) => this.mapToDomain(item)));
    } catch (error) {
      this._logger.error('supabase-response-repository.list-by-project-id-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async countPublicByProjectId(projectId: string): Promise<ResultEx<number, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.rpc('count_public_responses_by_project', {
        p_project_id: projectId,
      });
      if (error) {
        this._logger.error('supabase-response-repository.count-public-by-project-id-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }
      const count = typeof data === 'number' ? data : Number(data ?? 0);
      return ResultEx.success(count);
    } catch (error) {
      this._logger.error('supabase-response-repository.count-public-by-project-id-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(response: Response): Promise<ResultEx<Response, ResponseNotFoundError | InvalidResponseDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('responses')
        .update({
          answers: response.answers,
          audio_url: response.audioUrl,
          transcript: response.transcript,
          updated_at: response.updatedAt.toISOString(),
        })
        .eq('id', response.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-response-repository.update-not-found', { id: response.id });
          return ResultEx.failure(new ResponseNotFoundError(response.id));
        }
        this._logger.error('supabase-response-repository.update-error', { error });
        return ResultEx.failure(new InvalidResponseDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-response-repository.update-exception', { error });
      return ResultEx.failure(
        new InvalidResponseDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async updateModerationStatus(
    responseId: string,
    status: ModerationStatus
  ): Promise<ResultEx<Response, ResponseNotFoundError | InvalidResponseDataError>> {
    try {
      const supabase = getSupabaseClient();
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('responses')
        .update({ moderation_status: status, updated_at: now })
        .eq('id', responseId)
        .select()
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return ResultEx.failure(new ResponseNotFoundError(responseId));
        }
        this._logger.error('supabase-response-repository.update-moderation-status-error', { responseId, error });
        return ResultEx.failure(new InvalidResponseDataError(error.message));
      }
      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-response-repository.update-moderation-status-exception', { responseId, error });
      return ResultEx.failure(
        new InvalidResponseDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  private mapToDomain(data: any): Response {
    return {
      id: data.id,
      invitationId: data.invitation_id,
      projectId: data.project_id,
      answers: data.answers,
      audioUrl: data.audio_url,
      transcript: data.transcript,
      moderationStatus: data.moderation_status ?? null,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
}



