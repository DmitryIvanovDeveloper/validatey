export interface GenerateUserStoriesRequest {
  projectId: string;
}

export interface GenerateUserStoriesResponse {
  userStories: {
    id: string;
    role: string;
    goal: string;
    benefit: string;
    priority: 'high' | 'medium' | 'low';
    acceptanceCriteria: string[];
    functionalArea: string;
    solutionDirection?: string;
  }[];
  generatedAt: Date;
}