export type GetConsentRequirementsUseCaseRequest = {
  token: string;
};

export type GetConsentRequirementsUseCaseResponse = {
  consentRequired: boolean;
  consentText: string;
  dataUsageText: string;
  /** True if this invitation has already given consent (survey can proceed without showing consent screen). */
  alreadyConsented: boolean;
};
