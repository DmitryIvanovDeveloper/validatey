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
    console.log('🔍 AUTH: GetCurrentSessionUseCase.execute called');
    const session = await this._authService.getSession();
    console.log('🔍 AUTH: Session result:', session ? 'exists' : 'null', session?.user?.id);

    // Don't set userId here - let AppLayout handle it to avoid conflicts
    // The session data will be returned and AppLayout will set userId appropriately

    return {
      user: session?.user ?? null,
      role: session?.role ?? null,
    };
  }
}
