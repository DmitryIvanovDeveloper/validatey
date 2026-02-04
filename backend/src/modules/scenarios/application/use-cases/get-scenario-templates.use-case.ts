import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ScenarioTemplateRepositoryPort, ScenarioTemplate } from '../ports/scenario-template-repository.port';

@injectable()
export class GetScenarioTemplatesUseCase {
  constructor(
    @inject(TYPES.ScenarioTemplateRepository)
    private readonly _repository: ScenarioTemplateRepositoryPort
  ) {}

  async execute(): Promise<{ templates: ScenarioTemplate[] }> {
    const templates = await this._repository.list();
    return { templates };
  }

  async getBySlug(slug: string): Promise<ScenarioTemplate | null> {
    return this._repository.getBySlug(slug);
  }
}
