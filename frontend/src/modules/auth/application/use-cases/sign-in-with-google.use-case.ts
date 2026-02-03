import { injectable, inject } from 'inversify';
import type { AuthServicePort } from '../ports/auth-service.port';
import type { SignInWithGoogleInput, SignInWithGoogleOutput } from './input-output/auth.io';
import type { AuthSignInError } from '../../domain/errors/auth.error';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class SignInWithGoogleUseCase {
  constructor(
    @inject(TYPES.AuthService)
    private readonly _authService: AuthServicePort
  ) {}

  async execute(input: SignInWithGoogleInput): Promise<SignInWithGoogleOutput | AuthSignInError> {
    const { redirectUrl } = await this._authService.signInWithGoogle(input.redirectTo);
    return { redirectUrl };
  }
}
