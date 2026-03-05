import { injectable, inject } from 'inversify';
import { TYPES } from '../../application/types';
import { AddToWishlistUseCase } from '../../application/use-cases/add-to-wishlist.usecase';
import { GetWishlistCountUseCase } from '../../application/use-cases/get-wishlist-count.usecase';
import { ListProjectWishlistUseCase } from '../../application/use-cases/list-project-wishlist.use-case';

@injectable()
export class WishlistController {
  constructor(
    @inject(TYPES.AddToWishlistUseCase)
    private readonly _addToWishlistUseCase: AddToWishlistUseCase,
    @inject(TYPES.GetWishlistCountUseCase)
    private readonly _getWishlistCountUseCase: GetWishlistCountUseCase,
    @inject(TYPES.ListProjectWishlistUseCase)
    private readonly _listProjectWishlistUseCase: ListProjectWishlistUseCase
  ) {}

  async addToWishlist(input: { email: string; projectId?: string | null }) {
    return await this._addToWishlistUseCase.execute({
      email: input.email,
      projectId: input.projectId ?? undefined,
    });
  }

  async getWishlistCount() {
    return await this._getWishlistCountUseCase.execute();
  }

  async listByProject(projectId: string, userId: string) {
    return await this._listProjectWishlistUseCase.execute({ projectId, userId });
  }
}
