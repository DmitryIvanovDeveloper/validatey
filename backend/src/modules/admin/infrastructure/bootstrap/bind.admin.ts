import { Container } from 'inversify';
import { TYPES } from './types';
import type { GetCallerRolePort } from '../../application/ports/get-caller-role.port';
import type { ListUsersPort } from '../../application/ports/list-users.port';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { SupabaseAuthListUsersAdapter } from '../adapters/supabase-auth-list-users.adapter';
import type { GetUserRolePort } from '../../../auth/application/ports/get-user-role.port';
import { AUTH_TYPES } from '../../../auth/infrastructure/bootstrap/types';

export function bindAdmin(container: Container): void {
  container.bind<GetCallerRolePort>(TYPES.GetCallerRolePort).to(UserRoleRepository);
  container.bind<GetUserRolePort>(AUTH_TYPES.GetUserRolePort).to(UserRoleRepository);
  container.bind<ListUsersPort>(TYPES.ListUsersPort).to(SupabaseAuthListUsersAdapter);
  container.bind<ListUsersUseCase>(TYPES.ListUsersUseCase).to(ListUsersUseCase);
}
