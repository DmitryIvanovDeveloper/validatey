import { injectable, inject } from 'inversify';
import { TYPES } from '../../application/types';
import { AddToWishlistUseCase } from '../../application/use-cases/add-to-wishlist.usecase';
import { GetWishlistCountUseCase } from '../../application/use-cases/get-wishlist-count.usecase';

@injectable()
export class WishlistController {
  constructor(
    @inject(TYPES.AddToWishlistUseCase)
    private readonly _addToWishlistUseCase: AddToWishlistUseCase,
    @inject(TYPES.GetWishlistCountUseCase)
    private readonly _getWishlistCountUseCase: GetWishlistCountUseCase
  ) {}

  async addToWishlist(input: { email: string }) {
    return await this._addToWishlistUseCase.execute({ email: input.email });
  }

  async getWishlistCount() {
    return await this._getWishlistCountUseCase.execute();
  }
}
