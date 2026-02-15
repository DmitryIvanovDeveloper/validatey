import ResultEx from '../../../../infrastructure/result/result';

export interface ResearchAssistantContext {
  projectName: string;
  hypothesisSummary: string;
  comments?: Array<{
    content: string;
    author?: string;
    contextTitle?: string;
    sourceType: string;
  }>;
}

export interface AssistantReply {
  reply: string;
  suggestedMethods?: string[];
  clarificationQuestions?: string[];
}

export interface ResearchAssistantLlmPort {
  reply(userMessage: string, context: ResearchAssistantContext): Promise<ResultEx<AssistantReply, Error>>;
}
