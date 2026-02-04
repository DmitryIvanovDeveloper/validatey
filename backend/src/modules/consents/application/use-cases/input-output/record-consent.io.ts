export type RecordConsentUseCaseRequest = {
  invitationToken: string;
  /** Optional reference to consent template (e.g. template id). */
  consentTextId?: string | null;
  /** Snapshot of consent text at acceptance time. */
  consentText?: string | null;
  ip?: string | null;
  userAgent?: string | null;
};

export type RecordConsentUseCaseResponse = {
  consentId: string;
  acceptedAt: Date;
};
