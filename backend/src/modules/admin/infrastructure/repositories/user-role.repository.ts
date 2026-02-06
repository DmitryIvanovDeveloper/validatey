import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { Role } from '../../domain/value-objects/role.vo';
import type { GetCallerRolePort } from '../../application/ports/get-caller-role.port';
import type { GetUserRolePort } from '../../../auth/application/ports/get-user-role.port';

const TABLE = 'user_roles';

@injectable()
export class UserRoleRepository implements GetCallerRolePort, GetUserRolePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async getRole(userId: string): Promise<Role> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE)
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        this._logger.warn('user-role.repository.get-role-error', { userId, error });
        return 'user';
      }

      const role = data?.role;
      if (role === 'admin' || role === 'user') {
        return role;
      }
      return 'user';
    } catch (e) {
      this._logger.warn('user-role.repository.get-role-exception', { userId, error: e });
      return 'user';
    }
  }
}
