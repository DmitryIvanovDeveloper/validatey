import { Container } from 'inversify';
import { TYPES } from './types';
import { ResearchRepository } from '../repositories/research.repository';
import { ResearchRepositoryPort } from '../../application/ports/research-repository.port';
import { GetResearchCanvasUseCase } from '../../application/use-cases/get-research-canvas.use-case';
import { CollectResearchDataUseCase } from '../../application/use-cases/collect-research-data.use-case';
import { GenerateSynthesisUseCase } from '../../application/use-cases/generate-synthesis.use-case';
import { ResearchAssistantUseCase } from '../../application/use-cases/research-assistant.use-case';
import { CheckResearchAvailabilityUseCase } from '../../application/use-cases/check-research-availability.use-case';
import { GenerateUserStoriesUseCase } from '../../application/use-cases/generate-user-stories.use-case';
import { UserStoriesAiAdapter } from '../services/user-stories-ai.adapter';
import type { UserStoriesAiPort } from '../../application/ports/user-stories-ai.port';
import { ResearchPresenter } from '../../interface-adapters/presenters/research.presenter';
import { CommentsFetchStartedEventHandler } from '../../application/event-handlers/comments-fetch-started-event.handler';
import { CommentsFetchCompletedEventHandler } from '../../application/event-handlers/comments-fetch-completed-event.handler';
import { ResearchDataCollectionStartedEventHandler } from '../../application/event-handlers/research-data-collection-started-event.handler';

import { IAsyncEventHandler } from '../../../../infrastructure/event-bus/ports/event-handler.port';
import { CommentsFetchStartedEvent } from '../../../comments/domain/events/comments-fetch-started.event';
import { CommentsFetchCompletedEvent } from '../../../comments/domain/events/comments-fetch-completed.event';
import { ResearchDataCollectionStartedEvent } from '../../domain/events/research-data-collection-started.event';

export function bindResearch(container: Container): void {
  // Repository
  container.bind<ResearchRepositoryPort>(TYPES.ResearchRepositoryPort).to(ResearchRepository);

  // Ports
  container.bind<UserStoriesAiPort>(TYPES.UserStoriesAiPort).to(UserStoriesAiAdapter);

  // Use Cases
  container.bind(TYPES.GetResearchCanvasUseCase).to(GetResearchCanvasUseCase);
  container.bind(TYPES.CollectResearchDataUseCase).to(CollectResearchDataUseCase);
  container.bind(TYPES.GenerateSynthesisUseCase).to(GenerateSynthesisUseCase);
  container.bind(TYPES.ResearchAssistantUseCase).to(ResearchAssistantUseCase);
  container.bind(TYPES.CheckResearchAvailabilityUseCase).to(CheckResearchAvailabilityUseCase);
  container.bind(TYPES.GenerateUserStoriesUseCase).to(GenerateUserStoriesUseCase);

  // Presenters
  container.bind(TYPES.ResearchPresenter).to(ResearchPresenter);

  // Event Handlers
  container.bind<IAsyncEventHandler<CommentsFetchStartedEvent>>(TYPES.CommentsFetchStartedEventHandler).to(CommentsFetchStartedEventHandler);
  container.bind<IAsyncEventHandler<CommentsFetchCompletedEvent>>(TYPES.CommentsFetchCompletedEventHandler).to(CommentsFetchCompletedEventHandler);
  container.bind<IAsyncEventHandler<ResearchDataCollectionStartedEvent>>(TYPES.ResearchDataCollectionStartedEventHandler).to(ResearchDataCollectionStartedEventHandler);
}