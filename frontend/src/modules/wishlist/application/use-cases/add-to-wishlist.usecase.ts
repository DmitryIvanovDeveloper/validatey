import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { WishlistRepositoryPort } from '../ports/wishlist-repository.port';
import { InvalidEmailError } from '../../domain/errors/wishlist.error';
import type { WishlistEntry } from '../../domain/entities/wishlist.entity';
import Result from '../../../../infrastructure/result/result';

export interface AddToWishlistInput {
  email: string;
}

@injectable()
export class AddToWishlistUseCase {
  constructor(
    @inject(TYPES.WishlistRepository)
    private readonly _repository: WishlistRepositoryPort
  ) {}

  async execute(input: AddToWishlistInput): Promise<Result<WishlistEntry, InvalidEmailError>> {
    const email = input.email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Result.failure(new InvalidEmailError(email));
    }

    return await this._repository.add(email);
  }
}
