import type { ResearchCanvas, SynthesisReport } from '../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';

export interface ResearchRepositoryPort {
  getResearchCanvas(projectId: string): Promise<{
    canvas: ResearchCanvas;
    synthesisReport?: SynthesisReport | null;
    projectName?: string;
    projectHypothesis?: string;
    recommendedTemplate?: {
      name: string;
      slug: string;
      description: string;
    };
    assumptionStatuses?: ('confirmed' | 'need_more' | 'not_supported')[] | null;
    assumptionAssessments?: Array<{ assumptionId: string; status: string; evidence: string | null }> | null;
    researchStatus?: 'idle' | 'collecting' | 'synthesizing';
    researchStatusUpdatedAt?: string | null;
  }>;
  collectResearchData(projectId: string, intent: ResearchIntent): Promise<{
    collected: boolean;
    marketDataCollected: boolean;
    competitorDataCollected: boolean;
    autocompleteDataCollected: boolean;
    canvas?: ResearchCanvas;
  }>;
  generateSynthesis(projectId: string): Promise<SynthesisReport>;
  checkResearchAvailability(projectId: string): Promise<{
    available: boolean;
    nextAvailableAt: Date | null;
    timeUntilNext: number;
    formattedTimeRemaining?: string;
  }>;
  askAssistant(projectId: string, question: string): Promise<{
    reply: string;
    suggestedMethods?: string[];
    clarificationQuestions?: string[];
  }>;
}