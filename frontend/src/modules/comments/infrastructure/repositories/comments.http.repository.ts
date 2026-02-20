import { injectable, inject } from 'inversify';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type {
  CommentsHttpRepositoryPort,
  FetchJobStateDTO,
  GetCommentsResponseDTO,
  CreateSourceInput,
  SourceDTO,
} from '../../application/ports/comments-http-repository.port';
import Result from '../../../../infrastructure/result/result';

@injectable()
export class CommentsHttpRepository implements CommentsHttpRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async startFetch(
    projectId: string,
    options: {
      sourceType: 'reddit' | 'hackernews';
      redditUrls?: string[];
      hnFeedType?: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
      hnUrls?: string[];
      periodDays?: number;
    }
  ): Promise<Result<{ started: boolean }, Error>> {
    try {
      const payload = {
        sourceType: options.sourceType,
        redditUrls: options.redditUrls,
        hnFeedType: options.hnFeedType,
        hnUrls: options.hnUrls,
        periodDays: options.periodDays,
      };

      const data = await this._httpClient.post<{ status: string }>(
        `/projects/${projectId}/comments/fetch`,
        payload
      );

      return Result.success<{ started: boolean }>({ started: data?.status === 'started' });
    } catch (error) {
      return Result.failure<{ started: boolean }, Error>(error as Error);
    }
  }

  async getFetchStatus(): Promise<Result<FetchJobStateDTO, Error>> {
    try {
      const data = await this._httpClient.get<FetchJobStateDTO>(
        '/projects/dummy/comments/fetch/status' // Using dummy projectId since endpoint is global
      );

      return Result.success<FetchJobStateDTO>(data);
    } catch (error) {
      return Result.failure<FetchJobStateDTO, Error>(error as Error);
    }
  }

  async getComments(
    projectId: string,
    options?: {
      sourceId?: string;
      url?: string;
      isProcessed?: boolean;
      limit?: number;
    }
  ): Promise<Result<GetCommentsResponseDTO, Error>> {
    try {
      const params = new URLSearchParams();

      if (options?.sourceId) params.set('sourceId', options.sourceId);
      if (options?.url) params.set('url', options.url);
      if (options?.isProcessed !== undefined) params.set('isProcessed', String(options.isProcessed));
      if (options?.limit) params.set('limit', String(options.limit));

      const query = params.toString();
      const url = query ? `/projects/${projectId}/comments?${query}` : `/projects/${projectId}/comments`;

      const data = await this._httpClient.get<GetCommentsResponseDTO>(url);

      return Result.success<GetCommentsResponseDTO>(data);
    } catch (error) {
      return Result.failure<GetCommentsResponseDTO, Error>(error as Error);
    }
  }

  async createSource(projectId: string, input: CreateSourceInput): Promise<Result<SourceDTO, Error>> {
    try {
      const data = await this._httpClient.post<{ source: SourceDTO }>(`/projects/${projectId}/comments/sources`, input);
      return Result.success<SourceDTO>(data.source);
    } catch (error) {
      return Result.failure<SourceDTO, Error>(error as Error);
    }
  }

  async deleteSource(projectId: string, sourceId: string): Promise<Result<void, Error>> {
    try {
      await this._httpClient.delete<void>(`/projects/${projectId}/comments/sources/${sourceId}`);
      return Result.success(undefined);
    } catch (error) {
      return Result.failure<void, Error>(error as Error);
    }
  }

  async getCommentSources(projectId: string): Promise<Result<{ id: string; sourceType: 'reddit' | 'hackernews'; redditUrl?: string; hnUrl?: string }[], Error>> {
    try {
      const data = await this._httpClient.get<{ sources: { id: string; sourceType: 'reddit' | 'hackernews'; redditUrl?: string; hnUrl?: string }[] }>(`/projects/${projectId}/comments/sources`);
      return Result.success(data.sources);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}