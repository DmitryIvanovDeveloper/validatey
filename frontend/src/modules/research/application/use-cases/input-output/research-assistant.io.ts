export interface ResearchAssistantRequest {
  readonly projectId: string;
  readonly question: string;
}

export interface ResearchAssistantResponse {
  readonly reply: string;
  readonly suggestedMethods?: string[];
  readonly clarificationQuestions?: string[];
}