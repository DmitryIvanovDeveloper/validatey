import { injectable } from 'inversify';
import { ScenarioTemplateRepositoryPort, ScenarioTemplate } from '../../application/ports/scenario-template-repository.port';

const TEMPLATES: ScenarioTemplate[] = [
  {
    slug: 'problem-validation',
    name: 'Problem Validation',
    significanceTarget: 8
  },
  {
    slug: 'solution-validation',
    name: 'Solution Validation',
    significanceTarget: 8
  },
  {
    slug: 'pricing-validation',
    name: 'Pricing Validation',
    significanceTarget: 20
  },
  {
    slug: 'survey',
    name: 'Survey',
    significanceTarget: 40
  },
  {
    slug: 'statistical-analysis',
    name: 'Classic Statistical Analysis',
    significanceTarget: 400
  },
];

@injectable()
export class InMemoryScenarioTemplateRepository implements ScenarioTemplateRepositoryPort {
  async list(): Promise<ScenarioTemplate[]> {
    return [...TEMPLATES];
  }

  async getBySlug(slug: string): Promise<ScenarioTemplate | null> {
    return TEMPLATES.find((t) => t.slug === slug) ?? null;
  }
}
