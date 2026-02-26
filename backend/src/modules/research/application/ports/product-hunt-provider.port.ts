import ResultEx from '../../../../infrastructure/result/result';
import type { ProductHuntBlock } from '../../domain/value-objects/product-hunt-block.vo';

export interface ProductHuntProviderPort {
  fetchProductHunt(projectId: string, searchQuery: string): Promise<ResultEx<ProductHuntBlock | null, Error>>;
}
