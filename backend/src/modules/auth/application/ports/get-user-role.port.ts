/**
 * Port for resolving the current user's role (e.g. for session).
 * Implemented by shared UserRoleRepository; auth must not depend on admin module.
 */
export type UserRole = 'admin' | 'user';

export interface GetUserRolePort {
  getRole(userId: string): Promise<UserRole>;
}
