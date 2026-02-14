import { injectable, inject } from 'inversify';
import type { AuthServicePort } from '../ports/auth-service.port';
import type { GetCurrentSessionOutput } from './input-output/auth.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { userContextService } from '../../../../shared/services/user-context.service';

@injectable()
export class GetCurrentSessionUseCase {
  constructor(
    @inject(TYPES.AuthService)
    private readonly _authService: AuthServicePort
  ) {}

  async execute(): Promise<GetCurrentSessionOutput> {
    const session = await this._authService.getSession();

    // Sync userId with authenticated user if session exists
    if (session?.user) {
      userContextService.setUserId(session.user.id);
    }

    return {
      user: session?.user ?? null,
      role: session?.role ?? null,
    };
  }
}
