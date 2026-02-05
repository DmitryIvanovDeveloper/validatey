import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { ConsentRequirementsPort } from '../../application/ports/consent-requirements.port';

/**
 * Reads consent_text and consent_data_usage_text from projects table.
 * Returns empty strings when project has no consent configured or project not found.
 */
@injectable()
export class ProjectConsentRequirementsAdapter implements ConsentRequirementsPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async getByProjectId(
    projectId: string
  ): Promise<ResultEx<{ consentText: string; dataUsageText: string; privacyPolicyUrl?: string | null; termsOfServiceUrl?: string | null }, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('consent_text, consent_data_usage_text, privacy_policy_url, terms_of_service_url')
        .eq('id', projectId)
        .maybeSingle();

      if (error) {
        this._logger.error('project-consent-requirements.get-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      const consentText = (data?.consent_text ?? '') as string;
      const dataUsageText = (data?.consent_data_usage_text ?? '') as string;
      const privacyPolicyUrl = (data?.privacy_policy_url ?? null) as string | null;
      const termsOfServiceUrl = (data?.terms_of_service_url ?? null) as string | null;
      return ResultEx.success({ consentText, dataUsageText, privacyPolicyUrl, termsOfServiceUrl });
    } catch (err) {
      this._logger.error('project-consent-requirements.get-exception', { projectId, error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }
}
