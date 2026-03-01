import type { UserStory } from '../../ports/user-stories-llm.port';

export interface GenerateUserStoriesRequest {
  projectId: string;
}

/** API returns JSON only. Markdown formatting for display is done on the frontend. */
export interface GenerateUserStoriesResponse {
  userStories: UserStory[];
  generatedAt: Date;
}