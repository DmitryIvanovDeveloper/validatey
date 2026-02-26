import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import type { CommentPatternRepositoryPort } from '../../application/ports/comment-pattern-repository.port';
import type { CommentPatternAnalysis } from '../../domain/entities/comment-pattern-analysis.entity';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';

@injectable()
export class CommentPatternHttpRepository implements CommentPatternRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async getPatternAnalysis(projectId: string): Promise<CommentPatternAnalysis> {
    return this._httpClient.get<CommentPatternAnalysis>(
      API_CONFIG.ENDPOINTS.COMMENTS_PATTERNS(projectId)
    );
  }

  async getPatternComments(projectId: string, patternType: string, patternIndex?: number, commentIds?: string[]): Promise<{ comments: any[]; total: number; pattern: any }> {
    const base = `${API_CONFIG.ENDPOINTS.COMMENTS_PATTERNS(projectId)}/${patternType}/comments`;
    const params = new URLSearchParams();
    if (typeof patternIndex === 'number' && patternIndex >= 0) params.set('patternIndex', String(patternIndex));
    if (commentIds?.length) params.set('commentIds', commentIds.join(','));
    params.set('_', String(Date.now()));
    const url = `${base}?${params.toString()}`;
    return this._httpClient.get<{ comments: any[]; total: number; pattern: any }>(url);
  }
}
