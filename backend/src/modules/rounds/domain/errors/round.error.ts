export class RoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoundError';
  }
}

export class RoundNotFoundError extends RoundError {
  constructor(id: string) {
    super(`Round not found: ${id}`);
    this.name = 'RoundNotFoundError';
  }
}

export class InvalidRoundDataError extends RoundError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoundDataError';
  }
}
