import type { ResearchCanvas, SynthesisReport } from '../entities/research-canvas.entity';

export type ResearchStatusDto = 'idle' | 'collecting' | 'synthesizing';

export interface GetResearchCanvasResponse {
  canvas: ResearchCanvas;
  synthesisReport?: SynthesisReport | null;
  projectName?: string;
  projectHypothesis?: string;
  recommendedTemplate?: {
    name: string;
    slug: string;
    description: string;
  };
  error?: string;
  researchStatus?: ResearchStatusDto;
  researchStatusUpdatedAt?: string | null;
}

export interface CollectResearchDataResponse {
  canvas: ResearchCanvas;
  error?: string | {
    type: 'COOLDOWN';
    nextAvailableAt: string;
    timeUntilNext: number;
    formattedTimeRemaining: string;
  };
}

export interface CheckResearchAvailabilityResponse {
  available: boolean;
  nextAvailableAt: Date | null;
  timeUntilNext: number;
  formattedTimeRemaining?: string;
}

export interface GenerateSynthesisResponse {
  report: SynthesisReport;
  error?: string;
}

export interface AskAssistantResponse {
  reply: string;
  suggestedMethods?: string[];
  clarificationQuestions?: string[];
  error?: string;
}

export interface ResearchData extends GetResearchCanvasResponse {}

/** Partial research data (e.g. from overview API). Allows passing only synthesisReport for modal. */
export type ResearchDataProp =
  | ResearchData
  | { synthesisReport?: { summary?: string; recommendations?: string[]; verdict?: string } | null }
  | null
  | undefined;

export interface TabItem {
  id: string;
  label: string;
  icon?: any;
}