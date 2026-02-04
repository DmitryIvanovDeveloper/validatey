export const TYPES = {
  InvitationRepository: Symbol.for('InvitationRepository'),
  EmailService: Symbol.for('EmailService'),
  SMSService: Symbol.for('SMSService'),
  CreateInvitationsUseCase: Symbol.for('CreateInvitationsUseCase'),
  GetInvitationByTokenUseCase: Symbol.for('GetInvitationByTokenUseCase'),
  GetInvitationsByProjectIdUseCase: Symbol.for('GetInvitationsByProjectIdUseCase'),
  UpdateInvitationStatusUseCase: Symbol.for('UpdateInvitationStatusUseCase'),
  SendInvitationsUseCase: Symbol.for('SendInvitationsUseCase'),
  InvitationPresenter: Symbol.for('InvitationPresenter'),
} as const;



