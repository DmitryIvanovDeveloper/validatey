import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { WishlistRepositoryPort } from '../ports/wishlist-repository.port';
import type { WishlistEntry } from '../../domain/entities/wishlist.entity';
import Result from '../../../../infrastructure/result/result';

export interface ListProjectWishlistInput {
  projectId: string;
}

@injectable()
export class ListProjectWishlistUseCase {
  constructor(
    @inject(TYPES.WishlistRepository)
    private readonly _repository: WishlistRepositoryPort
  ) {}

  async execute(input: ListProjectWishlistInput): Promise<Result<WishlistEntry[], Error>> {
    return await this._repository.findAllByProject(input.projectId);
  }
}
