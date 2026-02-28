import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { ListWishlistPort, ListWishlistItemDTO } from '../../application/ports/list-wishlist.port';

@injectable()
export class SupabaseWishlistListAdapter implements ListWishlistPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async list(): Promise<ListWishlistItemDTO[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('wishlist')
      .select('id, email, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      this._logger.error('supabase-wishlist-list.error', { error });
      throw new Error(error.message ?? 'Failed to list wishlist entries');
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      email: entry.email,
      createdAt: new Date(entry.created_at),
    }));
  }
}