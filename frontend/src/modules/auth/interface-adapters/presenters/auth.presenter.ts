import { injectable, inject } from 'inversify';
import type { SignInWithGoogleUseCase } from '../../application/use-cases/sign-in-with-google.use-case';
import type { SignOutUseCase } from '../../application/use-cases/sign-out.use-case';
import type { GetCurrentSessionUseCase } from '../../application/use-cases/get-current-session.use-case';
import type { AuthServicePort } from '../../application/ports/auth-service.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { AuthViewModel } from '../view-models/auth.view-model';
import type { AuthSignInError } from '../../domain/errors/auth.error';

@injectable()
export class AuthPresenter {
  constructor(
    @inject(TYPES.SignInWithGoogleUseCase)
    private readonly _signInWithGoogleUseCase: SignInWithGoogleUseCase,
    @inject(TYPES.SignOutUseCase)
    private readonly _signOutUseCase: SignOutUseCase,
    @inject(TYPES.GetCurrentSessionUseCase)
    private readonly _getCurrentSessionUseCase: GetCurrentSessionUseCase,
    @inject(TYPES.AuthService)
    private readonly _authService: AuthServicePort
  ) {}

  async loadSession(viewModel: AuthViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;
    try {
      const result = await this._getCurrentSessionUseCase.execute();
      viewModel.user.value = result.user;
    } finally {
      viewModel.loading.value = false;
    }
  }

  /**
   * Subscribe to auth state changes (e.g. after callback). Call from component and pass viewModel to update.
   */
  subscribeToAuthState(viewModel: AuthViewModel): () => void {
    return this._authService.onAuthStateChange((session) => {
      viewModel.user.value = session?.user ?? null;
    });
  }

  async signInWithGoogle(viewModel: AuthViewModel): Promise<boolean> {
    viewModel.error.value = null;
    const redirectTo = `${window.location.origin}/auth/callback`;
    const result = await this._signInWithGoogleUseCase.execute({ redirectTo });
    if ('redirectUrl' in result) {
      window.location.href = result.redirectUrl;
      return true;
    }
    const err = result as AuthSignInError;
    viewModel.error.value = err.message;
    return false;
  }

  async signOut(viewModel: AuthViewModel): Promise<void> {
    viewModel.error.value = null;
    await this._signOutUseCase.execute();
    viewModel.user.value = null;
  }

  /** Call after login to reassign projects from anonymous userId to current user. */
  async linkPreviousUser(previousUserId: string): Promise<{ linked: number }> {
    return this._authService.linkPreviousUser(previousUserId);
  }
}
