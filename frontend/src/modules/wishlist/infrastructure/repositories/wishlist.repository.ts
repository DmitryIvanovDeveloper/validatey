import { injectable, inject } from 'inversify';
import type { WishlistRepositoryPort } from '../../application/ports/wishlist-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { WishlistEntry } from '../../domain/entities/wishlist.entity';
import { WishlistError, EmailAlreadyExistsError } from '../../domain/errors/wishlist.error';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class WishlistRepository implements WishlistRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async add(email: string): Promise<Result<WishlistEntry, WishlistError>> {
    try {
      const response = await this._httpClient.post<{
        id: string;
        email: string;
        createdAt: string;
      }>(API_CONFIG.ENDPOINTS.WISHLIST, { email });

      const entry = WishlistEntry.fromData({
        id: response.id,
        email: response.email,
        createdAt: response.createdAt,
      });

      return Result.success(entry);
    } catch (error: any) {
      if (error.message?.includes('already exists') || error.message?.includes('409')) {
        return Result.failure(new EmailAlreadyExistsError(email));
      }
      return Result.failure(new WishlistError(error.message || 'Failed to add to wishlist'));
    }
  }

  async getCount(): Promise<Result<number, WishlistError>> {
    try {
      const response = await this._httpClient.get<{ count: number }>(
        API_CONFIG.ENDPOINTS.WISHLIST_COUNT
      );
      return Result.success(response.count);
    } catch (error: any) {
      return Result.failure(new WishlistError(error.message || 'Failed to get wishlist count'));
    }
  }
}
