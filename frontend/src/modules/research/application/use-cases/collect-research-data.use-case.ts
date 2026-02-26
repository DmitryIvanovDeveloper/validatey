import { inject, injectable } from 'inversify';
import type { ResearchRepositoryPort } from '../ports/research-repository.port';
import type { ResearchCanvas } from '../../domain/entities/research-canvas.entity';
import type {
  CollectResearchDataRequest,
  CollectResearchDataResponse,
} from './input-output/collect-research-data.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { EventBusPort } from '../../../../infrastructure/event-bus/ports/event-bus.port';
import { ResearchStartedEvent } from '../../domain/events/research-started.event';
import { ResearchDataCollectionStartedEvent } from '../../domain/events/research-data-collection-started.event';

@injectable()
export class CollectResearchDataUseCase {
  constructor(
    @inject(TYPES.ResearchRepositoryPort)
    private readonly _researchRepository: ResearchRepositoryPort,
    @inject(ROOT_TYPES.EventBus)
    private readonly _eventBus: EventBusPort
  ) {}

  async execute(request: CollectResearchDataRequest): Promise<CollectResearchDataResponse> {
    // Publish ResearchStartedEvent to trigger comments fetching
    await this._eventBus.publishAsync(new ResearchStartedEvent(request.projectId));

    try {
      const result = await this._researchRepository.collectResearchData(
        request.projectId,
        request.intent
      );

      return {
        canvas: result.canvas ?? this.createEmptyCanvas(request.projectId),
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