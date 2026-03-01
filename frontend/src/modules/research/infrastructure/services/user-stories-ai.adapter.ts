import { inject, injectable } from 'inversify';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { UserStoriesAiPort } from '../../application/ports/user-stories-ai.port';

@injectable()
export class UserStoriesAiAdapter implements UserStoriesAiPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async generateUserStories(projectId: string): Promise<{
    userStories: {
      id: string;
      role: string;
      goal: string;
      benefit: string;
      priority: 'high' | 'medium' | 'low';
      acceptanceCriteria: string[];
      functionalArea: string;
    }[];
    generatedAt: Date;
  }> {
      const response = await this._httpClient.post<{
        userStories: {
          id: string;
          role: string;
          goal: string;
          benefit: string;
          priority: 'high' | 'medium' | 'low';
          acceptanceCriteria: string[];
          functionalArea: string;
        }[];
        generatedAt: string;
      }>(
        API_CONFIG.ENDPOINTS.RESEARCH_USER_STORIES(projectId),
        {}
      );

    return {
      userStories: response.userStories || [],
      generatedAt: response.generatedAt ? new Date(response.generatedAt) : new Date(),
    };
  }
}