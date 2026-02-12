import { Container } from 'inversify';
import { TYPES } from './types';
import { ResearchRepository } from '../repositories/research.repository';
import { ResearchRepositoryPort } from '../../application/ports/research-repository.port';
import { GetResearchCanvasUseCase } from '../../application/use-cases/get-research-canvas.use-case';
import { CollectResearchDataUseCase } from '../../application/use-cases/collect-research-data.use-case';
import { GenerateSynthesisUseCase } from '../../application/use-cases/generate-synthesis.use-case';
import { ResearchAssistantUseCase } from '../../application/use-cases/research-assistant.use-case';
import { ResearchPresenter } from '../../interface-adapters/presenters/research.presenter';

export function bindResearch(container: Container): void {
  // Repository
  container.bind<ResearchRepositoryPort>(TYPES.ResearchRepositoryPort).to(ResearchRepository);

  // Use Cases
  container.bind(TYPES.GetResearchCanvasUseCase).to(GetResearchCanvasUseCase);
  container.bind(TYPES.CollectResearchDataUseCase).to(CollectResearchDataUseCase);
  container.bind(TYPES.GenerateSynthesisUseCase).to(GenerateSynthesisUseCase);
  container.bind(TYPES.ResearchAssistantUseCase).to(ResearchAssistantUseCase);

  // Presenters
  container.bind(TYPES.ResearchPresenter).to(ResearchPresenter);
}