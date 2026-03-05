import { injectable } from 'inversify';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { WishlistRepositoryPort, WishlistEntry, CreateWishlistEntryInput } from '../../application/ports/wishlist-repository.port';
import ResultEx from '../../../../infrastructure/result/result';

@injectable()
export class SupabaseWishlistRepository implements WishlistRepositoryPort {
  async create(input: CreateWishlistEntryInput): Promise<ResultEx<WishlistEntry, Error>> {
    try {
      const email = input.email.trim().toLowerCase();
      const projectId = input.projectId?.trim() || null;

      const existing = await this.findByEmailAndProject(email, projectId);
      if (existing.isSuccess && existing.data) {
        return ResultEx.failure(new Error('Email already exists in wishlist'));
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('wishlist')
        .insert({
          email,
          project_id: projectId,
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
        projectId: data.project_id ?? null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error creating wishlist entry'));
    }
  }

  async findByEmailAndProject(email: string, projectId: string | null): Promise<ResultEx<WishlistEntry | null, Error>> {
    try {
      const supabase = getSupabaseClient();
      let q = supabase
        .from('wishlist')
        .select('*')
        .eq('email', email.trim().toLowerCase());
      if (projectId === null || projectId === undefined) {
        q = q.is('project_id', null);
      } else {
        q = q.eq('project_id', projectId);
      }
      const { data, error } = await q.single();

      if (error) {
        if (error.code === 'PGRST116') {
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
        projectId: data.project_id ?? null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error finding wishlist entry'));
    }
  }

  async count(projectId?: string | null): Promise<ResultEx<number, Error>> {
    try {
      const supabase = getSupabaseClient();
      let q = supabase.from('wishlist').select('*', { count: 'exact', head: true });
      if (projectId !== undefined && projectId !== null) {
        q = q.eq('project_id', projectId);
      } else if (projectId === null) {
        q = q.is('project_id', null);
      }
      const { count, error } = await q;

      if (error) {
        return ResultEx.failure(new Error(`Failed to count wishlist entries: ${error.message}`));
      }

      return ResultEx.success(count ?? 0);
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error counting wishlist entries'));
    }
  }

  async findAll(limit: number = 100, offset: number = 0, projectId?: string | null): Promise<ResultEx<WishlistEntry[], Error>> {
    try {
      const supabase = getSupabaseClient();
      let q = supabase
        .from('wishlist')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (projectId !== undefined && projectId !== null) {
        q = q.eq('project_id', projectId);
      } else if (projectId === null) {
        q = q.is('project_id', null);
      }
      const { data, error } = await q;

      if (error) {
        return ResultEx.failure(new Error(`Failed to find wishlist entries: ${error.message}`));
      }

      return ResultEx.success(
        (data || []).map((entry) => ({
          id: entry.id,
          email: entry.email,
          projectId: entry.project_id ?? null,
          createdAt: new Date(entry.created_at),
          updatedAt: new Date(entry.updated_at),
        }))
      );
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error finding wishlist entries'));
    }
  }
}
