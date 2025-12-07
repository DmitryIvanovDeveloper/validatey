export class InvitationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvitationError';
  }
}

export class InvitationNotFoundError extends InvitationError {
  constructor(invitationId: string) {
    super(`Invitation with id ${invitationId} not found`);
    this.name = 'InvitationNotFoundError';
  }
}

export class InvalidInvitationDataError extends InvitationError {
  constructor(message: string) {
    super(`Invalid invitation data: ${message}`);
    this.name = 'InvalidInvitationDataError';
  }
}

export class InvalidInvitationTokenError extends InvitationError {
  constructor(token: string) {
    super(`Invalid invitation token: ${token}`);
    this.name = 'InvalidInvitationTokenError';
  }
}


