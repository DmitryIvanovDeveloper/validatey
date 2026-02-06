import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { ListUsersPort, ListUsersItemDTO } from '../../application/ports/list-users.port';

const PER_PAGE = 1000;

function toItem(user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): ListUsersItemDTO {
  return {
    id: user.id,
    email: user.email ?? null,
    displayName:
      (user.user_metadata?.full_name as string) ??
      (user.user_metadata?.name as string) ??
      user.email ??
      null,
  };
}

@injectable()
export class SupabaseAuthListUsersAdapter implements ListUsersPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async list(): Promise<ListUsersItemDTO[]> {
    const supabase = getSupabaseClient();
    const all: ListUsersItemDTO[] = [];
    let page = 1;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });

      if (error) {
        this._logger.error('supabase-auth-list-users.error', { error });
        throw new Error(error.message ?? 'Failed to list users');
      }

      const users = data?.users ?? [];
      for (const u of users) {
        all.push(toItem(u));
      }

      if (users.length < PER_PAGE) break;
      page += 1;
    }

    return all;
  }
}
