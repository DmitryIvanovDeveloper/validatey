export type GetConsentRequirementsUseCaseRequest = {
  token: string;
};

export type GetConsentRequirementsUseCaseResponse = {
  consentRequired: boolean;
  consentText: string;
  dataUsageText: string;
  /** Privacy Policy URL shown on consent screen. */
  privacyPolicyUrl?: string | null;
  /** Terms of Service URL shown on consent screen. */
  termsOfServiceUrl?: string | null;
  /** True if this invitation has already given consent (survey can proceed without showing consent screen). */
  alreadyConsented: boolean;
};
