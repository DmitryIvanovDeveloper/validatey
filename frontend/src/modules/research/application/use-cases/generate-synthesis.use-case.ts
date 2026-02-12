import { inject, injectable } from 'inversify';
import type { ResearchRepositoryPort } from '../ports/research-repository.port';
import type {
  GenerateSynthesisRequest,
  GenerateSynthesisResponse,
} from './input-output/generate-synthesis.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GenerateSynthesisUseCase {
  constructor(
    @inject(TYPES.ResearchRepositoryPort)
    private readonly _researchRepository: ResearchRepositoryPort
  ) {}

  async execute(request: GenerateSynthesisRequest): Promise<GenerateSynthesisResponse> {
    const report = await this._researchRepository.generateSynthesis(request.projectId);

    return {
      report,
    };
  }
}