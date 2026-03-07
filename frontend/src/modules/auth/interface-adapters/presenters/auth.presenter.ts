import { injectable, inject } from 'inversify';
import type { SignInWithGoogleUseCase } from '../../application/use-cases/sign-in-with-google.use-case';
import type { RegisterWithEmailUseCase } from '../../application/use-cases/register-with-email.use-case';
import type { SignInWithEmailUseCase } from '../../application/use-cases/sign-in-with-email.use-case';
import type { SignOutUseCase } from '../../application/use-cases/sign-out.use-case';
import type { GetCurrentSessionUseCase } from '../../application/use-cases/get-current-session.use-case';
import type { AuthServicePort } from '../../application/ports/auth-service.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { AuthViewModel } from '../view-models/auth.view-model';
import type { AuthSignInError } from '../../domain/errors/auth.error';
import { sessionManager } from '../../../../shared/services/session-manager';

@injectable()
export class AuthPresenter {
  constructor(
    @inject(TYPES.SignInWithGoogleUseCase)
    private readonly _signInWithGoogleUseCase: SignInWithGoogleUseCase,
    @inject(TYPES.RegisterWithEmailUseCase)
    private readonly _registerWithEmailUseCase: RegisterWithEmailUseCase,
    @inject(TYPES.SignInWithEmailUseCase)
    private readonly _signInWithEmailUseCase: SignInWithEmailUseCase,
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
      viewModel.role.value = result.role;
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

  async signInWithGoogle(viewModel: AuthViewModel, _redirectPath?: string): Promise<boolean> {
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

  async registerWithEmail(viewModel: AuthViewModel, email: string, password: string): Promise<boolean> {
    viewModel.error.value = null;
    viewModel.registrationSuccessMessage.value = null;
    const result = await this._registerWithEmailUseCase.execute({ email, password });
    if ('session' in result && result.session?.user) {
      if (result.requiresEmailConfirmation) {
        viewModel.registrationSuccessMessage.value = 'Check your email to confirm your account, then sign in.';
        viewModel.user.value = null;
        viewModel.role.value = null;
      } else {
        viewModel.user.value = result.session.user;
        viewModel.role.value = result.session.role ?? 'user';
      }
      return true;
    }
    viewModel.error.value = (result as AuthSignInError).message;
    return false;
  }

  async signInWithEmail(viewModel: AuthViewModel, email: string, password: string): Promise<boolean> {
    viewModel.error.value = null;
    const result = await this._signInWithEmailUseCase.execute({ email, password });
    if ('session' in result && result.session?.user) {
      viewModel.user.value = result.session.user;
      viewModel.role.value = result.session.role ?? 'user';
      return true;
    }
    viewModel.error.value = (result as AuthSignInError).message;
    return false;
  }

  async signOut(viewModel: AuthViewModel): Promise<void> {
    viewModel.error.value = null;
    await this._signOutUseCase.execute();
    // Clear session in sessionManager
    sessionManager.clearSession();
    viewModel.user.value = null;
    viewModel.role.value = null;
  }

  /** Call after login to reassign projects from anonymous userId to current user. */
  async linkPreviousUser(previousUserId: string): Promise<{ linked: number }> {
    return this._authService.linkPreviousUser(previousUserId);
  }

  /** UI labels for the auth interface. */
  get labels() {
    return {
      loginTitle: 'Welcome to Validatey',
      loginSubtitle: 'Sign in to your account or create a new one',
      emailLabel: 'Email',
      emailPlaceholder: 'Enter your email address',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Enter your password',
      togglePasswordAria: 'Toggle password visibility',
      showPassword: 'Show',
      hidePassword: 'Hide',
      passwordHint: 'Password must be at least 6 characters long',
      createAccount: 'Create Account',
      signIn: 'Sign In',
      alreadyHaveAccount: 'Already have an account? Sign in',
      dontHaveAccount: "Don't have an account? Create one",
      orDivider: 'or',
      signInWithGoogle: 'Continue with Google'
    };
  }
}
