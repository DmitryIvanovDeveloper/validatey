import type { SynthesisReport } from '../../../domain/entities/synthesis-report.entity';

export type GenerateSynthesisRequest = {
  projectId: string;
};

export type GenerateSynthesisResponse = {
  report: SynthesisReport;
};
