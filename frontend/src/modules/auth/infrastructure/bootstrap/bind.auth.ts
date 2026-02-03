import { Container } from 'inversify';
import { TYPES } from './types';
import type { AuthServicePort } from '../../application/ports/auth-service.port';
import { ApiAuthService } from '../services/api-auth.service';
import { SignInWithGoogleUseCase } from '../../application/use-cases/sign-in-with-google.use-case';
import { SignOutUseCase } from '../../application/use-cases/sign-out.use-case';
import { GetCurrentSessionUseCase } from '../../application/use-cases/get-current-session.use-case';
import { AuthPresenter } from '../../interface-adapters/presenters/auth.presenter';

export function bindAuth(container: Container): void {
  container.bind<AuthServicePort>(TYPES.AuthService).to(ApiAuthService);
  container.bind<SignInWithGoogleUseCase>(TYPES.SignInWithGoogleUseCase).to(SignInWithGoogleUseCase);
  container.bind<SignOutUseCase>(TYPES.SignOutUseCase).to(SignOutUseCase);
  container.bind<GetCurrentSessionUseCase>(TYPES.GetCurrentSessionUseCase).to(GetCurrentSessionUseCase);
  container.bind<AuthPresenter>(TYPES.AuthPresenter).to(AuthPresenter);
}
