import { injectable, inject } from 'inversify';
import type { AuthServicePort } from '../ports/auth-service.port';
import type { GetCurrentSessionOutput } from './input-output/auth.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetCurrentSessionUseCase {
  constructor(
    @inject(TYPES.AuthService)
    private readonly _authService: AuthServicePort
  ) {}

  async execute(): Promise<GetCurrentSessionOutput> {
    const session = await this._authService.getSession();
    return {
      user: session?.user ?? null,
      role: session?.role ?? null,
    };
  }
}
