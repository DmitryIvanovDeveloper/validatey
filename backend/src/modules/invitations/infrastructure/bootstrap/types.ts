export const TYPES = {
  InvitationRepository: Symbol.for('InvitationRepository'),
  EmailService: Symbol.for('EmailService'),
  SMSService: Symbol.for('SMSService'),
  CreateInvitationsUseCase: Symbol.for('CreateInvitationsUseCase'),
  GetInvitationByTokenUseCase: Symbol.for('GetInvitationByTokenUseCase'),
  UpdateInvitationStatusUseCase: Symbol.for('UpdateInvitationStatusUseCase'),
  InvitationPresenter: Symbol.for('InvitationPresenter'),
} as const;

