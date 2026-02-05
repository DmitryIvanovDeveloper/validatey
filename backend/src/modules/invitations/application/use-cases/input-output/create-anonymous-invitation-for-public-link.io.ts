export type CreateAnonymousInvitationForPublicLinkUseCaseRequest = {
  publicSlug: string;
};

export type CreateAnonymousInvitationForPublicLinkUseCaseResponse = {
  token: string;
  invitationId: string;
  projectId: string;
};
