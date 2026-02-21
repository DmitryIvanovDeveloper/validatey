import { injectable } from 'inversify';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { WishlistRepositoryPort, WishlistEntry, CreateWishlistEntryInput } from '../../application/ports/wishlist-repository.port';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class SupabaseWishlistRepository implements WishlistRepositoryPort {
  async create(input: CreateWishlistEntryInput): Promise<ResultEx<WishlistEntry, Error>> {
    try {
      const email = input.email.trim().toLowerCase();
      
      // Check if email already exists
      const existing = await this.findByEmail(email);
      if (existing.isSuccess && existing.data) {
        return ResultEx.failure(new Error('Email already exists in wishlist'));
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          email,
        })
        .select()
        .single();

      if (error) {
        return ResultEx.failure(new Error(`Failed to create wishlist entry: ${error.message}`));
      }

      if (!data) {
        return ResultEx.failure(new Error('Failed to create wishlist entry: no data returned'));
      }

      return ResultEx.success({
        id: data.id,
        email: data.email,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error creating wishlist entry'));
    }
  }

  async findByEmail(email: string): Promise<ResultEx<WishlistEntry | null, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return ResultEx.success(null);
        }
        return ResultEx.failure(new Error(`Failed to find wishlist entry: ${error.message}`));
      }

      if (!data) {
        return ResultEx.success(null);
      }

      return ResultEx.success({
        id: data.id,
        email: data.email,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error finding wishlist entry'));
    }
  }

  async count(): Promise<ResultEx<number, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { count, error } = await supabase
        .from('wishlist')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return ResultEx.failure(new Error(`Failed to count wishlist entries: ${error.message}`));
      }

      return ResultEx.success(count || 0);
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error counting wishlist entries'));
    }
  }

  async findAll(limit: number = 100, offset: number = 0): Promise<ResultEx<WishlistEntry[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return ResultEx.failure(new Error(`Failed to find wishlist entries: ${error.message}`));
      }

      return ResultEx.success(
        (data || []).map((entry) => ({
          id: entry.id,
          email: entry.email,
          createdAt: new Date(entry.created_at),
          updatedAt: new Date(entry.updated_at),
        }))
      );
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error finding wishlist entries'));
    }
  }
}
