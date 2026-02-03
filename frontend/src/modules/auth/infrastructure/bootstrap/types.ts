export const TYPES = {
  AuthService: Symbol.for('AuthService'),
  SignInWithGoogleUseCase: Symbol.for('SignInWithGoogleUseCase'),
  SignOutUseCase: Symbol.for('SignOutUseCase'),
  GetCurrentSessionUseCase: Symbol.for('GetCurrentSessionUseCase'),
  AuthPresenter: Symbol.for('AuthPresenter'),
} as const;
