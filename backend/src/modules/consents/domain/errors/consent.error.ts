export class ConsentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConsentError';
  }
}

export class ConsentAlreadyGivenError extends ConsentError {
  constructor(invitationId: string) {
    super(`Consent already recorded for invitation ${invitationId}`);
    this.name = 'ConsentAlreadyGivenError';
  }
}

export class InvalidConsentDataError extends ConsentError {
  constructor(message: string) {
    super(`Invalid consent data: ${message}`);
    this.name = 'InvalidConsentDataError';
  }
}

export class ConsentNotFoundError extends ConsentError {
  constructor(id: string) {
    super(`Consent not found: ${id}`);
    this.name = 'ConsentNotFoundError';
  }
}
