import ResultEx from '../../../../infrastructure/result/result';
import type { SynthesisReport } from '../../domain/value-objects/synthesis-report.vo';
import type { SynthesisGenerationError } from '../../domain/errors/research.error';

export interface CommentMetrics {
  /** Total number of comments analyzed. */
  totalCount: number;
  /** Source breakdown, e.g. { reddit: 120, hackernews: 45 } */
  bySource: Record<string, number>;
}

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
  /** Product Hunt launches relevant to the hypothesis (optional). */
  productHuntSummary?: string;
  /** Hard factual comment metrics passed directly to LLM to ground its verdict decision. */
  commentMetrics?: CommentMetrics;
}

export interface SynthesisLlmPort {
  generateSynthesis(input: SynthesisInput): Promise<ResultEx<SynthesisReport, SynthesisGenerationError>>;
}
