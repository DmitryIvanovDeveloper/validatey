export class DeletionRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeletionRequestError';
  }
}

export class DeletionRequestNotFoundError extends DeletionRequestError {
  constructor(id: string) {
    super(`Deletion request not found: ${id}`);
    this.name = 'DeletionRequestNotFoundError';
  }
}

export class InvalidDeletionRequestDataError extends DeletionRequestError {
  constructor(message: string) {
    super(`Invalid deletion request data: ${message}`);
    this.name = 'InvalidDeletionRequestDataError';
  }
}
