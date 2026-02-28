/**
 * DTO for one wishlist entry in the admin list (id, email, createdAt).
 */
export interface ListWishlistItemDTO {
  id: string;
  email: string;
  createdAt: Date;
}

/**
 * Port to list all wishlist entries (admin only). Implemented via Supabase.
 */
export interface ListWishlistPort {
  list(): Promise<ListWishlistItemDTO[]>;
}