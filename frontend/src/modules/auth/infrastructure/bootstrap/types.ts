export const TYPES = {
  AuthService: Symbol.for('AuthService'),
  SignInWithGoogleUseCase: Symbol.for('SignInWithGoogleUseCase'),
  RegisterWithEmailUseCase: Symbol.for('RegisterWithEmailUseCase'),
  SignInWithEmailUseCase: Symbol.for('SignInWithEmailUseCase'),
  SignOutUseCase: Symbol.for('SignOutUseCase'),
  GetCurrentSessionUseCase: Symbol.for('GetCurrentSessionUseCase'),
  AuthPresenter: Symbol.for('AuthPresenter'),
} as const;
