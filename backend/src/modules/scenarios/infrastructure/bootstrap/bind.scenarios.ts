import { Container } from 'inversify';
import { TYPES } from './types';
import { ScenarioRepositoryPort } from '../../application/ports/scenario-repository.port';
import { SupabaseScenarioRepository } from '../repositories/supabase-scenario.repository';
import { LLMServicePort } from '../../application/ports/llm-service.port';
import { HttpLLMService } from '../services/http-llm.service';
import { GenerateScenarioUseCase } from '../../application/use-cases/generate-scenario.use-case';
import { SaveScenarioVersionUseCase } from '../../application/use-cases/save-scenario-version.use-case';
import { GetScenarioUseCase } from '../../application/use-cases/get-scenario.use-case';
import { ScenarioPresenter } from '../../interface-adapters/presenters/scenario.presenter';

export function bindScenarios(container: Container): void {
  // Repository
  container.bind<ScenarioRepositoryPort>(TYPES.ScenarioRepository).to(SupabaseScenarioRepository);

  // LLM Service
  container.bind<LLMServicePort>(TYPES.LLMService).to(HttpLLMService);

  // Use Cases
  container.bind<GenerateScenarioUseCase>(TYPES.GenerateScenarioUseCase).to(GenerateScenarioUseCase);
  container.bind<SaveScenarioVersionUseCase>(TYPES.SaveScenarioVersionUseCase).to(SaveScenarioVersionUseCase);
  container.bind<GetScenarioUseCase>(TYPES.GetScenarioUseCase).to(GetScenarioUseCase);

  // Presenter
  container.bind<ScenarioPresenter>(TYPES.ScenarioPresenter).to(ScenarioPresenter);
}

