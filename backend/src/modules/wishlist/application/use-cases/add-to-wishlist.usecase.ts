import { injectable, inject } from 'inversify';
import { TYPES } from '../../application/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { WishlistRepositoryPort } from '../ports/wishlist-repository.port';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';

export interface AddToWishlistInput {
  email: string;
  projectId?: string | null;
}

export interface AddToWishlistOutput {
  id: string;
  email: string;
  projectId: string | null;
  createdAt: Date;
}

@injectable()
export class AddToWishlistUseCase {
  constructor(
    @inject(TYPES.WishlistRepository)
    private readonly _wishlistRepository: WishlistRepositoryPort,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async execute(input: AddToWishlistInput): Promise<ResultEx<AddToWishlistOutput, Error>> {
    const email = input.email.trim().toLowerCase();
    const projectId = input.projectId?.trim() || null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResultEx.failure(new Error('Invalid email address'));
    }

    const result = await this._wishlistRepository.create({ email, projectId });

    if (!result.isSuccess) {
      this._logger.warn('add-to-wishlist.failed', { email, projectId, error: result.error.message });
      return ResultEx.failure(result.error);
    }

    this._logger.info('add-to-wishlist.success', { email, projectId, id: result.data.id });

    return ResultEx.success({
      id: result.data.id,
      email: result.data.email,
      projectId: result.data.projectId,
      createdAt: result.data.createdAt,
    });
  }
}
