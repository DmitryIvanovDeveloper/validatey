import type { ResearchCanvas, SynthesisReport } from '../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';

export interface ResearchRepositoryPort {
  getResearchCanvas(projectId: string): Promise<ResearchCanvas>;
  collectResearchData(projectId: string, intent: ResearchIntent): Promise<{
    collected: boolean;
    marketDataCollected: boolean;
    competitorDataCollected: boolean;
    autocompleteDataCollected: boolean;
  }>;
  generateSynthesis(projectId: string): Promise<SynthesisReport>;
  askAssistant(projectId: string, question: string): Promise<{
    reply: string;
    suggestedMethods?: string[];
    clarificationQuestions?: string[];
  }>;
}