import { injectable, inject } from 'inversify';
import type { ResponseRepositoryPort, GetResponsesOptions } from '../../application/ports/response-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import type { Response, ModerationStatus } from '../../domain/entities/response.entity';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class ResponseRepository implements ResponseRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async getByProjectId(projectId: string, options?: GetResponsesOptions): Promise<{ responses: Response[]; total: number; error?: string }> {
    try {
      const params = new URLSearchParams();
      if (options?.limit) params.append('limit', options.limit.toString());
      if (options?.offset) params.append('offset', options.offset.toString());
      if (options?.searchText) params.append('search', options.searchText);
      if (options?.sortBy) params.append('sortBy', options.sortBy);
      if (options?.sortOrder) params.append('sortOrder', options.sortOrder);

      const queryString = params.toString();
      const url = queryString ? `${API_CONFIG.ENDPOINTS.RESPONSES(projectId)}?${queryString}` : API_CONFIG.ENDPOINTS.RESPONSES(projectId);

      const response = await this._httpClient.get<{
        responses: Array<{
          id: string;
          invitationId: string;
          projectId: string;
          answers: Record<string, any>;
          audioUrl: string | null;
          transcript: string | null;
          moderationStatus: ModerationStatus | null;
          createdAt: string;
          updatedAt: string;
        }>;
        total?: number;
      }>(url);

      const responses: Response[] = response.responses.map(r => ({
        id: r.id,
        invitationId: r.invitationId,
        projectId: r.projectId,
        answers: r.answers,
        audioUrl: r.audioUrl,
        transcript: r.transcript,
        moderationStatus: r.moderationStatus,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));

      return {
        responses,
        total: response.total || responses.length,
      };
    } catch (error) {
      return {
        responses: [],
        total: 0,
        error: error instanceof Error ? error.message : 'Failed to fetch responses',
      };
    }
  }

  async getById(responseId: string): Promise<{ response: Response | null; error?: string }> {
    try {
      // Note: This endpoint might not be implemented yet in backend
      const response = await this._httpClient.get<{
        response: {
          id: string;
          invitationId: string;
          projectId: string;
          answers: Record<string, any>;
          audioUrl: string | null;
          transcript: string | null;
          moderationStatus: ModerationStatus | null;
          createdAt: string;
          updatedAt: string;
        };
      }>(`/responses/${responseId}`);

      const r = response.response;
      return {
        response: {
          id: r.id,
          invitationId: r.invitationId,
          projectId: r.projectId,
          answers: r.answers,
          audioUrl: r.audioUrl,
          transcript: r.transcript,
          moderationStatus: r.moderationStatus,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        },
      };
    } catch (error) {
      return {
        response: null,
        error: error instanceof Error ? error.message : 'Failed to fetch response',
      };
    }
  }

  async moderate(responseId: string, status: ModerationStatus): Promise<{ success: boolean; error?: string }> {
    try {
      // We need projectId to make the request. This is a limitation of the current API.
      // For now, we'll assume the responseId contains project info or we'll need to modify the API
      // TODO: Update API to accept responseId directly without needing projectId

      await this._httpClient.patch(API_CONFIG.ENDPOINTS.RESPONSE_MODERATE('', responseId), {
        status,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to moderate response',
      };
    }
  }

  async getPendingForModeration(projectId: string): Promise<{ responses: Response[]; error?: string }> {
    try {
      const response = await this._httpClient.get<{
        responses: Array<{
          id: string;
          invitationId: string;
          projectId: string;
          answers: Record<string, any>;
          audioUrl: string | null;
          transcript: string | null;
          moderationStatus: ModerationStatus | null;
          createdAt: string;
          updatedAt: string;
        }>;
      }>(API_CONFIG.ENDPOINTS.RESPONSES_MODERATION(projectId, 'pending'));

      const responses: Response[] = response.responses.map(r => ({
        id: r.id,
        invitationId: r.invitationId,
        projectId: r.projectId,
        answers: r.answers,
        audioUrl: r.audioUrl,
        transcript: r.transcript,
        moderationStatus: r.moderationStatus,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));

      return { responses };
    } catch (error) {
      return {
        responses: [],
        error: error instanceof Error ? error.message : 'Failed to fetch responses for moderation',
      };
    }
  }
}