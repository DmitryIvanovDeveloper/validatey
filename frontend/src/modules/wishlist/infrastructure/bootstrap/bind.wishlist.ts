import { Container } from 'inversify';
import { TYPES } from './types';
import { WishlistRepositoryPort } from '../../application/ports/wishlist-repository.port';
import { WishlistRepository } from '../repositories/wishlist.repository';
import { AddToWishlistUseCase } from '../../application/use-cases/add-to-wishlist.usecase';
import { GetWishlistCountUseCase } from '../../application/use-cases/get-wishlist-count.usecase';
import { WishlistPresenter } from '../../interface-adapters/presenters/wishlist.presenter';

export function bindWishlist(container: Container): void {
  // Repository
  container.bind<WishlistRepositoryPort>(TYPES.WishlistRepository).to(WishlistRepository).inSingletonScope();

  // Use Cases
  container.bind<AddToWishlistUseCase>(TYPES.AddToWishlistUseCase).to(AddToWishlistUseCase);
  container.bind<GetWishlistCountUseCase>(TYPES.GetWishlistCountUseCase).to(GetWishlistCountUseCase);

  // Presenter
  container.bind<WishlistPresenter>(TYPES.WishlistPresenter).to(WishlistPresenter);
}
