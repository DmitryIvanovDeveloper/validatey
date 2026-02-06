/**
 * DTO for one user in the admin list (id, email, displayName).
 */
export interface ListUsersItemDto {
  id: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Port to list all auth users (admin only). Implemented via Supabase Auth Admin API.
 */
export interface ListUsersPort {
  list(): Promise<ListUsersItemDto[]>;
}
