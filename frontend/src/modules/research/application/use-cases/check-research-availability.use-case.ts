import { inject, injectable } from 'inversify';
import type { ResearchRepositoryPort } from '../ports/research-repository.port';
import type {
  CheckResearchAvailabilityRequest,
  CheckResearchAvailabilityResponse,
} from './input-output/check-research-availability.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CheckResearchAvailabilityUseCase {
  constructor(
    @inject(TYPES.ResearchRepositoryPort)
    private readonly _researchRepository: ResearchRepositoryPort
  ) {}

  async execute(request: CheckResearchAvailabilityRequest): Promise<CheckResearchAvailabilityResponse> {
    return await this._researchRepository.checkResearchAvailability(request.projectId);
  }
}