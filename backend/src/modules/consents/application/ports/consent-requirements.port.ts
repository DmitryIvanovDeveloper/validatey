import ResultEx from '../../../../infrastructure/result/result';

/**
 * Provides consent template text for a project (consent text + data usage text).
 * Implemented in infrastructure (e.g. from project row or consent_templates table).
 */
export interface ConsentRequirementsPort {
  getByProjectId(projectId: string): Promise<
    ResultEx<
      {
        consentText: string;
        dataUsageText: string;
        privacyPolicyUrl?: string | null;
        termsOfServiceUrl?: string | null;
      },
      Error
    >
  >;
}
