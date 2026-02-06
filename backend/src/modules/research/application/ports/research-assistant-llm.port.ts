import ResultEx from '../../../../infrastructure/result/result';

export interface ResearchAssistantContext {
  projectName: string;
  hypothesisSummary: string;
}

export interface AssistantReply {
  reply: string;
  suggestedMethods?: string[];
  clarificationQuestions?: string[];
}

export interface ResearchAssistantLlmPort {
  reply(userMessage: string, context: ResearchAssistantContext): Promise<ResultEx<AssistantReply, Error>>;
}
