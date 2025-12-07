export abstract class InvitationError extends Error {
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

export class InvalidTokenError extends InvitationError {
  constructor(token: string) {
    super(`Invalid invitation token: ${token}`);
    this.name = 'InvalidTokenError';
  }
}

export class InvitationSendError extends InvitationError {
  constructor(message: string) {
    super(`Failed to send invitation: ${message}`);
    this.name = 'InvitationSendError';
  }
}


