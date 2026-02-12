import { inject, injectable } from 'inversify';
import type { ResearchRepositoryPort } from '../ports/research-repository.port';
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
    const result = await this._researchRepository.collectResearchData(
      request.projectId,
      request.intent
    );

    return result;
  }
}