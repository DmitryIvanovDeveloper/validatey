import type { Role } from '../../domain/value-objects/role.vo';

/**
 * Port to resolve the role of a user (for admin guard).
 */
export interface GetCallerRolePort {
  getRole(userId: string): Promise<Role>;
}
