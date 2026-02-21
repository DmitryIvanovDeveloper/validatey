import { Container } from 'inversify';
import { TYPES } from '../../application/types';
import { WishlistRepositoryPort } from '../../application/ports/wishlist-repository.port';
import { SupabaseWishlistRepository } from '../repositories/supabase-wishlist.repository';
import { AddToWishlistUseCase } from '../../application/use-cases/add-to-wishlist.usecase';
import { GetWishlistCountUseCase } from '../../application/use-cases/get-wishlist-count.usecase';
import { WishlistController } from '../../interface-adapters/controllers/wishlist.controller';

export function bindWishlist(container: Container): void {
  // Repository
  container.bind<WishlistRepositoryPort>(TYPES.WishlistRepository).to(SupabaseWishlistRepository).inSingletonScope();

  // Use Cases
  container.bind<AddToWishlistUseCase>(TYPES.AddToWishlistUseCase).to(AddToWishlistUseCase);
  container.bind<GetWishlistCountUseCase>(TYPES.GetWishlistCountUseCase).to(GetWishlistCountUseCase);

  // Controller
  container.bind<WishlistController>(TYPES.WishlistController).to(WishlistController);
}
