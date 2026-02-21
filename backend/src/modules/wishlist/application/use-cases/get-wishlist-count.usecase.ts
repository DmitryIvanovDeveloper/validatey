import { injectable, inject } from 'inversify';
import { TYPES } from '../types';
import { WishlistRepositoryPort } from '../ports/wishlist-repository.port';
import ResultEx from '../../../../infrastructure/result/result';

export interface GetWishlistCountOutput {
  count: number;
}

@injectable()
export class GetWishlistCountUseCase {
  constructor(
    @inject(TYPES.WishlistRepository)
    private readonly _wishlistRepository: WishlistRepositoryPort
  ) {}

  async execute(): Promise<ResultEx<GetWishlistCountOutput, Error>> {
    const result = await this._wishlistRepository.count();

    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }

    return ResultEx.success({
      count: result.data,
    });
  }
}
