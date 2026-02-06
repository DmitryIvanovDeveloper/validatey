import { injectable, inject } from 'inversify';
import type { AuthServicePort } from '../ports/auth-service.port';
import type { RegisterWithEmailInput, EmailAuthOutput } from './input-output/auth.io';
import type { AuthSignInError } from '../../domain/errors/auth.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class RegisterWithEmailUseCase {
  constructor(
    @inject(TYPES.AuthService)
    private readonly _authService: AuthServicePort
  ) {}

  async execute(input: RegisterWithEmailInput): Promise<EmailAuthOutput | AuthSignInError> {
    try {
      const result = await this._authService.registerWithEmail(input.email, input.password);
      if (!result.session) return { message: 'Registration failed', name: 'AuthSignInError' } as AuthSignInError;
      return {
        session: { user: result.session.user, role: result.session.role },
        requiresEmailConfirmation: result.requiresEmailConfirmation,
      };
    } catch (e) {
      return {
        message: e instanceof Error ? e.message : 'Registration failed',
        name: 'AuthSignInError',
      } as AuthSignInError;
    }
  }
}
