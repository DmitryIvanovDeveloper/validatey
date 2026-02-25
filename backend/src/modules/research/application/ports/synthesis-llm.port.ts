import ResultEx from '../../../../infrastructure/result/result';
import type { SynthesisReport } from '../../domain/value-objects/synthesis-report.vo';
import type { SynthesisGenerationError } from '../../domain/errors/research.error';

export interface SynthesisInput {
  projectName: string;
  hypothesisSummary: string;
  marketSummary: string;
  competitorSummary: string;
  autocompleteSummary: string;
  userInsightsSummary: string;
  commentsSummary: string;
  commentPatternSummary?: string;
  earlySignalsSummary: string;
  /** Summaries of relevant academic research papers (optional; may be absent on first run). */
  academicPapersSummary?: string;
}

export interface SynthesisLlmPort {
  generateSynthesis(input: SynthesisInput): Promise<ResultEx<SynthesisReport, SynthesisGenerationError>>;
}
