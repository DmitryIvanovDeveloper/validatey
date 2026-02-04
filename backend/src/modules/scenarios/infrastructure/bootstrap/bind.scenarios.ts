import { Container } from 'inversify';
import { TYPES } from './types';
import { ScenarioRepositoryPort } from '../../application/ports/scenario-repository.port';
import { ScenarioTemplateRepositoryPort } from '../../application/ports/scenario-template-repository.port';
import { ScenarioRatingRepositoryPort } from '../../application/ports/scenario-rating-repository.port';
import { SupabaseScenarioRepository } from '../repositories/supabase-scenario.repository';
import { SupabaseScenarioRatingRepository } from '../repositories/supabase-scenario-rating.repository';
import { InMemoryScenarioTemplateRepository } from '../repositories/in-memory-scenario-template.repository';
import { LLMServicePort } from '../../application/ports/llm-service.port';
import { ProxyScenarioService } from '../services/proxy-scenario.service';
import { GenerateScenarioUseCase } from '../../application/use-cases/generate-scenario.use-case';
import { SaveScenarioVersionUseCase } from '../../application/use-cases/save-scenario-version.use-case';
import { SaveScenarioRatingUseCase } from '../../application/use-cases/save-scenario-rating.use-case';
import { GetScenarioUseCase } from '../../application/use-cases/get-scenario.use-case';
import { GetScenarioTemplatesUseCase } from '../../application/use-cases/get-scenario-templates.use-case';
import { ValidateScenarioStructureUseCase } from '../../application/use-cases/validate-scenario-structure.use-case';
import { ScenarioPresenter } from '../../interface-adapters/presenters/scenario.presenter';

export function bindScenarios(container: Container): void {
  // Repository
  container.bind<ScenarioRepositoryPort>(TYPES.ScenarioRepository).to(SupabaseScenarioRepository);
  container.bind<ScenarioTemplateRepositoryPort>(TYPES.ScenarioTemplateRepository).to(InMemoryScenarioTemplateRepository);
  container.bind<ScenarioRatingRepositoryPort>(TYPES.ScenarioRatingRepository).to(SupabaseScenarioRatingRepository);

  // LLM Service: only proxy API (cerebras-api.vercel.app/api/prompt)
  container.bind<LLMServicePort>(TYPES.LLMService).to(ProxyScenarioService);

  // Use Cases
  container.bind<GenerateScenarioUseCase>(TYPES.GenerateScenarioUseCase).to(GenerateScenarioUseCase);
  container.bind<SaveScenarioVersionUseCase>(TYPES.SaveScenarioVersionUseCase).to(SaveScenarioVersionUseCase);
  container.bind<SaveScenarioRatingUseCase>(TYPES.SaveScenarioRatingUseCase).to(SaveScenarioRatingUseCase);
  container.bind<GetScenarioUseCase>(TYPES.GetScenarioUseCase).to(GetScenarioUseCase);
  container.bind<GetScenarioTemplatesUseCase>(TYPES.GetScenarioTemplatesUseCase).to(GetScenarioTemplatesUseCase);
  container.bind<ValidateScenarioStructureUseCase>(TYPES.ValidateScenarioStructureUseCase).to(ValidateScenarioStructureUseCase);

  // Presenter
  container.bind<ScenarioPresenter>(TYPES.ScenarioPresenter).to(ScenarioPresenter);
}



