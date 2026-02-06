import type { SynthesisReport } from '../../../domain/value-objects/synthesis-report.vo';

export type GenerateSynthesisRequest = {
  projectId: string;
};

export type GenerateSynthesisResponse = {
  report: SynthesisReport;
};
