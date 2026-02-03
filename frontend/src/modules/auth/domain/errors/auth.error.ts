export abstract class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthSignInError extends AuthError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthSignInError';
  }
}

export class AuthSignOutError extends AuthError {
  constructor(message: string) {
    super(message);
    this.name = 'AuthSignOutError';
  }
}
