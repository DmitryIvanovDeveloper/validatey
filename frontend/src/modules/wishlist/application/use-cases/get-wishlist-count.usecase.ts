import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { WishlistRepositoryPort } from '../ports/wishlist-repository.port';
import Result from '../../../../infrastructure/result/result';

@injectable()
export class GetWishlistCountUseCase {
  constructor(
    @inject(TYPES.WishlistRepository)
    private readonly _repository: WishlistRepositoryPort
  ) {}

  async execute(): Promise<Result<number, Error>> {
    return await this._repository.getCount();
  }
}
