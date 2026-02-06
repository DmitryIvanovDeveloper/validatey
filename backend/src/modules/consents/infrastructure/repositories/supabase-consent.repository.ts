import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Consent } from '../../domain/entities/consent.entity';
import { InvalidConsentDataError } from '../../domain/errors/consent.error';
import { ConsentRepositoryPort } from '../../application/ports/consent-repository.port';

@injectable()
export class SupabaseConsentRepository implements ConsentRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async save(consent: Consent): Promise<ResultEx<Consent, InvalidConsentDataError>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('consents')
        .insert({
          id: consent.id,
          project_id: consent.projectId,
          invitation_id: consent.invitationId,
          consent_text_id: consent.consentTextId,
          consent_text: consent.consentText,
          accepted_at: consent.acceptedAt.toISOString(),
          ip: consent.ip,
          user_agent: consent.userAgent,
          created_at: consent.createdAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-consent-repository.save-error', { error });
        return ResultEx.failure(new InvalidConsentDataError(error.message));
      }
      return ResultEx.success(this.mapToDomain(data));
    } catch (err) {
      this._logger.error('supabase-consent-repository.save-exception', { error: err });
      return ResultEx.failure(
        new InvalidConsentDataError(err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }

  async findByInvitationId(invitationId: string): Promise<ResultEx<Consent | null, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('consents')
        .select('*')
        .eq('invitation_id', invitationId)
        .maybeSingle();

      if (error) {
        this._logger.error('supabase-consent-repository.find-by-invitation-id-error', {
          invitationId,
          error,
        });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(data ? this.mapToDomain(data) : null);
    } catch (err) {
      this._logger.error('supabase-consent-repository.find-by-invitation-id-exception', {
        invitationId,
        error: err,
      });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async listByProjectId(projectId: string): Promise<ResultEx<Consent[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('consents')
        .select('*')
        .eq('project_id', projectId)
        .order('accepted_at', { ascending: false });

      if (error) {
        this._logger.error('supabase-consent-repository.list-by-project-id-error', {
          projectId,
          error,
        });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success((data || []).map((row) => this.mapToDomain(row)));
    } catch (err) {
      this._logger.error('supabase-consent-repository.list-by-project-id-exception', {
        projectId,
        error: err,
      });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  private mapToDomain(row: Record<string, unknown>): Consent {
    const r = row as { id: string; project_id: string; invitation_id: string; consent_text_id: string | null; consent_text: string | null; accepted_at: string; ip: string | null; user_agent: string | null; created_at: string };
    return {
      id: r.id,
      projectId: r.project_id,
      invitationId: r.invitation_id,
      consentTextId: r.consent_text_id,
      consentText: r.consent_text,
      acceptedAt: new Date(r.accepted_at),
      ip: r.ip,
      userAgent: r.user_agent,
      createdAt: new Date(r.created_at),
    };
  }
}
