import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { ProductHuntProviderPort } from '../../application/ports/product-hunt-provider.port';
import type { ProductHuntBlock, ProductHuntPost } from '../../domain/value-objects/product-hunt-block.vo';

/** Product Hunt Algolia: override in .env. Defaults are from public PH docs (may be outdated). */
const PH_ALGOLIA_APP_ID = process.env.PRODUCT_HUNT_ALGOLIA_APP_ID ?? '0H4SMABBSG';
const PH_ALGOLIA_API_KEY = process.env.PRODUCT_HUNT_ALGOLIA_API_KEY ?? '9670d2d619b9d07859448d7628eea5f3';
const PH_ALGOLIA_INDEX = process.env.PRODUCT_HUNT_ALGOLIA_INDEX ?? 'Post_production';
const MAX_HITS = 15;

function getPhAlgoliaBase(): string {
  const id = PH_ALGOLIA_APP_ID;
  return id ? `https://${id}-dsn.algolia.net` : '';
}

interface PHAlgoliaHit {
  readonly name?: string | null;
  readonly tagline?: string | null;
  readonly slug?: string | null;
  readonly website_url?: string | null;
  readonly votes_count?: number | null;
  readonly description?: string | null;
  readonly objectID?: string | null;
}

interface PHAlgoliaResponse {
  readonly hits?: readonly PHAlgoliaHit[];
}

@injectable()
export class ProductHuntAlgoliaProviderAdapter implements ProductHuntProviderPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async fetchProductHunt(
    projectId: string,
    searchQuery: string
  ): Promise<ResultEx<ProductHuntBlock | null, Error>> {
    const query = searchQuery?.trim() ?? '';
    if (!query) {
      return ResultEx.success(null);
    }

    if (!PH_ALGOLIA_APP_ID || !PH_ALGOLIA_API_KEY) {
      this._logger.info('product-hunt-provider.skipped', { projectId, reason: 'PRODUCT_HUNT_ALGOLIA_APP_ID or PRODUCT_HUNT_ALGOLIA_API_KEY not set' });
      return ResultEx.success(null);
    }

    const base = getPhAlgoliaBase();
    if (!base) {
      return ResultEx.success(null);
    }

    this._logger.info('product-hunt-provider.start', { projectId, query });

    try {
      const url = `${base}/1/indexes/${encodeURIComponent(PH_ALGOLIA_INDEX)}/query`;
      const params = `query=${encodeURIComponent(query)}&hitsPerPage=${MAX_HITS}`;
      const response = await this._http.post<PHAlgoliaResponse>(
        url,
        { params },
        {
          'Content-Type': 'application/json',
          'X-Algolia-Application-Id': PH_ALGOLIA_APP_ID,
          'X-Algolia-API-Key': PH_ALGOLIA_API_KEY,
        }
      );

      const hits = response?.hits ?? [];
      this._logger.info('product-hunt-provider.api-response', { projectId, query, returned: hits.length });

      const posts: ProductHuntPost[] = [];
      for (const h of hits) {
        const name = h.name?.trim();
        const tagline = h.tagline?.trim();
        if (!name) continue;
        const slug = h.slug ?? h.objectID ?? '';
        const url = slug
          ? `https://www.producthunt.com/posts/${encodeURIComponent(slug)}`
          : (h.website_url ?? 'https://www.producthunt.com');
        posts.push({
          name,
          tagline: tagline ?? '',
          url,
          votesCount: typeof h.votes_count === 'number' ? h.votes_count : undefined,
          description: h.description?.trim() ?? null,
        });
      }

      if (posts.length === 0) {
        this._logger.info('product-hunt-provider.no-posts', { projectId, query });
        return ResultEx.success(null);
      }

      const block: ProductHuntBlock = {
        posts,
        searchQuery: query,
        fetchedAt: new Date(),
      };
      this._logger.info('product-hunt-provider.success', { projectId, query, count: posts.length });
      return ResultEx.success(block);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this._logger.warn('product-hunt-provider.error', { projectId, query, error: message });
      return ResultEx.success(null);
    }
  }
}
