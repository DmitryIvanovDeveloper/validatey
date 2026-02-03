import { injectable, inject } from 'inversify';
import type { AuthServicePort } from '../ports/auth-service.port';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class SignOutUseCase {
  constructor(
    @inject(TYPES.AuthService)
    private readonly _authService: AuthServicePort
  ) {}

  async execute(): Promise<void> {
    await this._authService.signOut();
  }
}
