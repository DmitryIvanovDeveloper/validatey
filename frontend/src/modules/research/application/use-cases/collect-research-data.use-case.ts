import { inject, injectable } from 'inversify';
import type { ResearchRepositoryPort } from '../ports/research-repository.port';
import type { ResearchCanvas } from '../../domain/entities/research-canvas.entity';
import type {
  CollectResearchDataRequest,
  CollectResearchDataResponse,
} from './input-output/collect-research-data.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CollectResearchDataUseCase {
  constructor(
    @inject(TYPES.ResearchRepositoryPort)
    private readonly _researchRepository: ResearchRepositoryPort
  ) {}

  async execute(request: CollectResearchDataRequest): Promise<CollectResearchDataResponse> {
    try {
      const result = await this._researchRepository.collectResearchData(
        request.projectId,
        request.intent
      );

      return {
        canvas: result.canvas || {},
        error: undefined
      };
    } catch (error) {
      return {
        canvas: this.createEmptyCanvas(request.projectId),
        error: error instanceof Error ? error.message : 'Failed to collect research data',
      };
    }
  }

  private createEmptyCanvas(projectId: string) {
    return {
      projectId,
      marketData: {},
      competitorInfo: {},
      userInsights: {},
      autocompleteInsights: null,
      earlySignals: null,
    };
  }
}