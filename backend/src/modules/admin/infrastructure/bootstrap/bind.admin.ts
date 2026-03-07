import { Container } from 'inversify';
import { TYPES } from './types';
import type { GetCallerRolePort } from '../../application/ports/get-caller-role.port';
import type { ListUsersPort } from '../../application/ports/list-users.port';
import type { ListWishlistPort } from '../../application/ports/list-wishlist.port';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { UserRoleRepository } from '../repositories/user-role.repository';
import { SupabaseAuthListUsersAdapter } from '../adapters/supabase-auth-list-users.adapter';
import { SupabaseWishlistListAdapter } from '../adapters/supabase-wishlist-list.adapter';
import type { GetUserRolePort } from '../../../auth/application/ports/get-user-role.port';
import { AUTH_TYPES } from '../../../auth/infrastructure/bootstrap/types';
import { TYPES as WISHLIST_TYPES } from '../../../wishlist/application/types';
import type { ListWishlistUseCase } from '../../../wishlist/application/use-cases/list-wishlist.use-case';
import { AdminController } from '../../interface-adapters/controllers/admin.controller';

export function bindAdmin(container: Container): void {
  container.bind<GetCallerRolePort>(TYPES.GetCallerRole).to(UserRoleRepository);
  container.bind<GetUserRolePort>(AUTH_TYPES.GetUserRole).to(UserRoleRepository);
  container.bind<ListUsersPort>(TYPES.ListUsers).to(SupabaseAuthListUsersAdapter);
  container.bind<ListUsersUseCase>(TYPES.ListUsersUseCase).to(ListUsersUseCase);
  container.bind<ListWishlistPort>(TYPES.ListWishlist).to(SupabaseWishlistListAdapter);
  container.bind<AdminController>(TYPES.AdminController).to(AdminController);
  // ListWishlistUseCase and other use cases are bound in their respective modules
}
