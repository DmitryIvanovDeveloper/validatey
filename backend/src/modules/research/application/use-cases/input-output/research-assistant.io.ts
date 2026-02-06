import type { AssistantReply } from '../../ports/research-assistant-llm.port';

export type ResearchAssistantRequest = {
  projectId: string;
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
};

export type ResearchAssistantResponse = AssistantReply;
