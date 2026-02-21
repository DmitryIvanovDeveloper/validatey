export const TYPES = {
  InvitationRepository: Symbol.for('InvitationRepository'),
  EmailService: Symbol.for('EmailService'),
  SMSService: Symbol.for('SMSService'),
  CreateInvitationsUseCase: Symbol.for('CreateInvitationsUseCase'),
  GetInvitationByTokenUseCase: Symbol.for('GetInvitationByTokenUseCase'),
  GetInvitationsByProjectIdUseCase: Symbol.for('GetInvitationsByProjectIdUseCase'),
  UpdateInvitationStatusUseCase: Symbol.for('UpdateInvitationStatusUseCase'),
  SendInvitationsUseCase: Symbol.for('SendInvitationsUseCase'),
  CreateAnonymousInvitationForPublicLinkUseCase: Symbol.for('CreateAnonymousInvitationForPublicLinkUseCase'),
  SurveyPlatformsLlm: Symbol.for('SurveyPlatformsLlm'),
  SuggestSurveyPlatformsUseCase: Symbol.for('SuggestSurveyPlatformsUseCase'),
  InvitationController: Symbol.for('InvitationController'),
} as const;



