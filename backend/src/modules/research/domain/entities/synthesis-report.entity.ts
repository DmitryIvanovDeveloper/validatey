/** Entity/value for synthesis report (LLM-generated summary). */
export interface SynthesisReport {
  readonly summary: string;
  readonly recommendations: readonly string[];
  readonly sections?: readonly { title: string; content: string }[];
}
