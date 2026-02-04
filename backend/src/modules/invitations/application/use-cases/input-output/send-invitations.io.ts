export type SendInvitationsUseCaseInput = {
  projectId: string;
  invitationIds: string[];
  surveyBaseUrl: string;
};

export type SendInvitationsUseCaseOutput = {
  sent: number;
  failed: number;
  errors?: string[];
};
