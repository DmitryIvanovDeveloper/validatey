import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Invitation, InvitationStatus } from '../../domain/entities/invitation.entity';
import { InvitationNotFoundError, InvalidInvitationDataError } from '../../domain/errors/invitation.error';
import { InvitationRepositoryPort } from '../../application/ports/invitation-repository.port';

@injectable()
export class SupabaseInvitationRepository implements InvitationRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(invitation: Invitation): Promise<ResultEx<Invitation, InvalidInvitationDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('invitations')
        .insert({
          id: invitation.id,
          project_id: invitation.projectId,
          token: invitation.token,
          email: invitation.email,
          phone: invitation.phone,
          status: invitation.status,
          sent_at: invitation.sentAt?.toISOString() || null,
          opened_at: invitation.openedAt?.toISOString() || null,
          completed_at: invitation.completedAt?.toISOString() || null,
          reminder_count: invitation.reminderCount,
          created_at: invitation.createdAt.toISOString(),
          updated_at: invitation.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-invitation-repository.create-error', { error });
        return ResultEx.failure(new InvalidInvitationDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-invitation-repository.create-exception', { error });
      return ResultEx.failure(
        new InvalidInvitationDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Invitation, InvitationNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('invitations').select('*').eq('id', id).single();

      if (error || !data) {
        this._logger.error('supabase-invitation-repository.find-by-id-error', { id, error });
        return ResultEx.failure(new InvitationNotFoundError(id));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-invitation-repository.find-by-id-exception', { id, error });
      return ResultEx.failure(new InvitationNotFoundError(id));
    }
  }

  async findByToken(token: string): Promise<ResultEx<Invitation, InvitationNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      this._logger.info('supabase-invitation-repository.find-by-token-start', { 
        token: token.substring(0, 10) + '...',
        tokenLength: token.length 
      });

      const { data, error } = await supabase.from('invitations').select('*').eq('token', token).single();

      if (error) {
        this._logger.error('supabase-invitation-repository.find-by-token-error', { 
          token: token.substring(0, 10) + '...', 
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        });
        return ResultEx.failure(new InvitationNotFoundError(token));
      }

      if (!data) {
        this._logger.warn('supabase-invitation-repository.find-by-token-no-data', { 
          token: token.substring(0, 10) + '...' 
        });
        return ResultEx.failure(new InvitationNotFoundError(token));
      }

      this._logger.info('supabase-invitation-repository.find-by-token-success', { 
        invitationId: data.id,
        projectId: data.project_id
      });

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-invitation-repository.find-by-token-exception', { 
        token: token.substring(0, 10) + '...', 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return ResultEx.failure(new InvitationNotFoundError(token));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<Invitation[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        this._logger.error('supabase-invitation-repository.find-by-project-id-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(data.map((item) => this.mapToDomain(item)));
    } catch (error) {
      this._logger.error('supabase-invitation-repository.find-by-project-id-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(invitation: Invitation): Promise<ResultEx<Invitation, InvitationNotFoundError | InvalidInvitationDataError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('invitations')
        .update({
          status: invitation.status,
          sent_at: invitation.sentAt?.toISOString() || null,
          opened_at: invitation.openedAt?.toISOString() || null,
          completed_at: invitation.completedAt?.toISOString() || null,
          reminder_count: invitation.reminderCount,
          updated_at: invitation.updatedAt.toISOString(),
        })
        .eq('id', invitation.id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-invitation-repository.update-not-found', { id: invitation.id });
          return ResultEx.failure(new InvitationNotFoundError(invitation.id));
        }
        this._logger.error('supabase-invitation-repository.update-error', { error });
        return ResultEx.failure(new InvalidInvitationDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-invitation-repository.update-exception', { error });
      return ResultEx.failure(
        new InvalidInvitationDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async createMany(invitations: Invitation[]): Promise<ResultEx<Invitation[], InvalidInvitationDataError>> {
    try {
      const supabase = getSupabaseClient();

      const insertData = invitations.map((inv) => ({
        id: inv.id,
        project_id: inv.projectId,
        token: inv.token,
        email: inv.email,
        phone: inv.phone,
        status: inv.status,
        sent_at: inv.sentAt?.toISOString() || null,
        opened_at: inv.openedAt?.toISOString() || null,
        completed_at: inv.completedAt?.toISOString() || null,
        reminder_count: inv.reminderCount,
        created_at: inv.createdAt.toISOString(),
        updated_at: inv.updatedAt.toISOString(),
      }));

      const { data, error } = await supabase.from('invitations').insert(insertData).select();

      if (error) {
        this._logger.error('supabase-invitation-repository.create-many-error', { error });
        return ResultEx.failure(new InvalidInvitationDataError(error.message));
      }

      return ResultEx.success(data.map((item) => this.mapToDomain(item)));
    } catch (error) {
      this._logger.error('supabase-invitation-repository.create-many-exception', { error });
      return ResultEx.failure(
        new InvalidInvitationDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  private mapToDomain(data: Record<string, unknown>): Invitation {
    const d = data as { id: string; project_id: string; token: string; email: string | null; phone: string | null; status: string; sent_at: string | null; opened_at: string | null; completed_at: string | null; reminder_count: number; created_at: string; updated_at: string };
    return {
      id: d.id,
      projectId: d.project_id,
      token: d.token,
      email: d.email,
      phone: d.phone,
      status: d.status as InvitationStatus,
      sentAt: d.sent_at ? new Date(d.sent_at) : null,
      openedAt: d.opened_at ? new Date(d.opened_at) : null,
      completedAt: d.completed_at ? new Date(d.completed_at) : null,
      reminderCount: d.reminder_count,
      createdAt: new Date(d.created_at),
      updatedAt: new Date(d.updated_at),
    };
  }
}



