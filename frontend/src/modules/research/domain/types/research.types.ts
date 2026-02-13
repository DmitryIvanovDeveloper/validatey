import type { ResearchCanvas, SynthesisReport } from '../entities/research-canvas.entity';

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
}

export interface CollectResearchDataResponse {
  canvas: ResearchCanvas;
  error?: string;
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

export interface TabItem {
  id: string;
  label: string;
  icon?: any;
}