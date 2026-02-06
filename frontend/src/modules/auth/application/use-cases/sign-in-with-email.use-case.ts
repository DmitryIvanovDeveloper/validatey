import { injectable, inject } from 'inversify';
import type { AuthServicePort } from '../ports/auth-service.port';
import type { SignInWithEmailInput, EmailAuthOutput } from './input-output/auth.io';
import type { AuthSignInError } from '../../domain/errors/auth.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class SignInWithEmailUseCase {
  constructor(
    @inject(TYPES.AuthService)
    private readonly _authService: AuthServicePort
  ) {}

  async execute(input: SignInWithEmailInput): Promise<EmailAuthOutput | AuthSignInError> {
    try {
      const session = await this._authService.signInWithEmail(input.email, input.password);
      if (!session) return { message: 'Sign in failed', name: 'AuthSignInError' } as AuthSignInError;
      return { session: { user: session.user, role: session.role } };
    } catch (e) {
      return {
        message: e instanceof Error ? e.message : 'Sign in failed',
        name: 'AuthSignInError',
      } as AuthSignInError;
    }
  }
}
