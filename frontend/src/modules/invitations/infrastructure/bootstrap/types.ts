export const TYPES = {
  InvitationRepository: Symbol.for('InvitationRepository'),
  GetInvitationByTokenUseCase: Symbol.for('GetInvitationByTokenUseCase'),
  CreateInvitationsUseCase: Symbol.for('CreateInvitationsUseCase'),
  SendInvitationsUseCase: Symbol.for('SendInvitationsUseCase'),
  InvitationService: Symbol.for('InvitationService'),
  InvitationPresenter: Symbol.for('InvitationPresenter'),
  InvitationManagerPresenter: Symbol.for('InvitationManagerPresenter'),
} as const;



