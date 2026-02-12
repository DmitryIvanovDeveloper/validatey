import { injectable } from 'inversify';
import ResultEx from '../../../../infrastructure/result/result';
import type { SynthesisLlmPort } from '../../application/ports/synthesis-llm.port';
import type { SynthesisInput } from '../../application/ports/synthesis-llm.port';
import type { SynthesisReport } from '../../domain/value-objects/synthesis-report.vo';

/** Stub: synthesis is not available in test environment. */
@injectable()
export class SynthesisLlmStubAdapter implements SynthesisLlmPort {
  async generateSynthesis(input: SynthesisInput): Promise<ResultEx<SynthesisReport, Error>> {
    return ResultEx.failure(new Error('Synthesis AI service is not available in test environment'));
  }
}