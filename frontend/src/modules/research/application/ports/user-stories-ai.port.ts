export interface UserStoriesAiPort {
  generateUserStories(projectId: string): Promise<{
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
  }>;
}