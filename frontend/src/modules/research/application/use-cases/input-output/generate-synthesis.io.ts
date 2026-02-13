import type { SynthesisReport } from '../../../domain/entities/research-canvas.entity';

export interface GenerateSynthesisRequest {
  readonly projectId: string;
}

export interface GenerateSynthesisResponse {
  readonly report: SynthesisReport;
  readonly error?: string;
}