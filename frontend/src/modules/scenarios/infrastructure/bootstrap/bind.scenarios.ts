import { Container } from 'inversify';
import { TYPES } from './types';
import { ScenarioRepositoryPort } from '../../application/ports/scenario-repository.port';
import { ScenarioRepository } from '../repositories/scenario.repository';
import { GenerateScenarioUseCase } from '../../application/use-cases/generate-scenario.use-case';
import { ScenarioPresenter } from '../../interface-adapters/presenters/scenario.presenter';

export function bindScenarios(container: Container): void {
  container.bind<ScenarioRepositoryPort>(TYPES.ScenarioRepository).to(ScenarioRepository);
  container.bind<GenerateScenarioUseCase>(TYPES.GenerateScenarioUseCase).to(GenerateScenarioUseCase);
  container.bind<ScenarioPresenter>(TYPES.ScenarioPresenter).to(ScenarioPresenter);
}

