import { inject, injectable } from 'inversify';
import type { ResearchRepositoryPort } from '../ports/research-repository.port';
import type {
  GetResearchCanvasRequest,
  GetResearchCanvasResponse,
} from './input-output/get-research-canvas.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetResearchCanvasUseCase {
  constructor(
    @inject(TYPES.ResearchRepositoryPort)
    private readonly _researchRepository: ResearchRepositoryPort
  ) {}

  async execute(request: GetResearchCanvasRequest): Promise<GetResearchCanvasResponse> {
    const canvas = await this._researchRepository.getResearchCanvas(request.projectId);

    return {
      canvas,
      projectName: `Project ${request.projectId}`,
      recommendedTemplate: {
        name: 'Market Research Template',
        slug: 'market-research',
        description: 'Comprehensive market analysis with competitor insights',
      },
    };
  }
}