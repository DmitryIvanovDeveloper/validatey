import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { AddToWishlistUseCase } from '../../application/use-cases/add-to-wishlist.usecase';
import { GetWishlistCountUseCase } from '../../application/use-cases/get-wishlist-count.usecase';
import { EmailAlreadyExistsError, InvalidEmailError } from '../../domain/errors/wishlist.error';

@injectable()
export class WishlistPresenter {
  constructor(
    @inject(TYPES.AddToWishlistUseCase)
    private readonly _addToWishlistUseCase: AddToWishlistUseCase,
    @inject(TYPES.GetWishlistCountUseCase)
    private readonly _getWishlistCountUseCase: GetWishlistCountUseCase
  ) {}

  async addToWishlist(email: string): Promise<{ success: boolean; error?: string }> {
    const result = await this._addToWishlistUseCase.execute({ email });

    if (!result.isSuccess) {
      const err = result.error as unknown;
      if (err instanceof EmailAlreadyExistsError) {
        return { success: false, error: 'You\'re already on the waitlist!' };
      }
      if (err instanceof InvalidEmailError) {
        return { success: false, error: 'Please enter a valid email address' };
      }
      return { success: false, error: err instanceof Error ? err.message : 'Failed to join waitlist' };
    }

    return { success: true };
  }

  async getCount(): Promise<{ count: number; error?: string }> {
    const result = await this._getWishlistCountUseCase.execute();

    if (!result.isSuccess) {
      return { count: 0, error: result.error.message || 'Failed to get wishlist count' };
    }

    return { count: result.data };
  }
}
