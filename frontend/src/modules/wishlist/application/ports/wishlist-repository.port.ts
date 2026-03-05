import Result from '../../../../infrastructure/result/result';
import { WishlistEntry } from '../../domain/entities/wishlist.entity';
import { WishlistError } from '../../domain/errors/wishlist.error';

export interface WishlistRepositoryPort {
  add(email: string): Promise<Result<WishlistEntry, WishlistError>>;
  getCount(): Promise<Result<number, WishlistError>>;
  /** List entries for a project (for Overview waitlist widget). */
  findAllByProject(projectId: string): Promise<Result<WishlistEntry[], WishlistError>>;
}
