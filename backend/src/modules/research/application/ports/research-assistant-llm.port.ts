import ResultEx from '../../../../infrastructure/result/result';
import type { CommentPatternAnalysis } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';

export interface ResearchAssistantContext {
  projectName: string;
  hypothesisSummary: string;
  comments?: Array<{
    content: string;
    author?: string;
    contextTitle?: string;
    sourceType: string;
  }>;
  commentPatternAnalysis?: CommentPatternAnalysis | null;
}

export interface AssistantReply {
  reply: string;
  suggestedMethods?: string[];
  clarificationQuestions?: string[];
}

export interface ResearchAssistantLlmPort {
  reply(userMessage: string, context: ResearchAssistantContext): Promise<ResultEx<AssistantReply, Error>>;
}
