import { injectable } from 'inversify';
import { ScenarioTemplateRepositoryPort, ScenarioTemplate } from '../../application/ports/scenario-template-repository.port';

const WTP_CONTENT = JSON.stringify({
  questions: [
    { id: 'q_1', text: 'How acute is this problem for you today? (1 = not at all, 5 = very acute)', type: 'scale', required: true, options: { min: 1, max: 5, label: 'Problem severity' } },
    { id: 'q_2', text: 'What would you be willing to pay per month for a solution? (currency or range)', type: 'open', required: true },
    { id: 'q_3', text: 'What alternatives have you tried or considered?', type: 'open', required: false },
  ],
});

const FEATURE_DEMAND_CONTENT = JSON.stringify({
  questions: [
    { id: 'q_1', text: 'How important is this feature to you? (1–5)', type: 'scale', required: true, options: { min: 1, max: 5 } },
    { id: 'q_2', text: 'Describe how you would use this feature.', type: 'open', required: true },
    { id: 'q_3', text: 'Would you pay extra for this feature?', type: 'multiple_choice', required: true, options: { choices: ['Yes', 'No', 'Maybe'], multiple: false } },
  ],
});

const VALUE_PROP_CONTENT = JSON.stringify({
  questions: [
    { id: 'q_1', text: 'How well does this value proposition match your needs? (1–5)', type: 'scale', required: true, options: { min: 1, max: 5 } },
    { id: 'q_2', text: 'What would make this more compelling for you?', type: 'open', required: false },
    { id: 'q_3', text: 'Who do you think this is best suited for?', type: 'open', required: false },
  ],
});

const TEMPLATES: ScenarioTemplate[] = [
  { slug: 'wtp', name: 'WTP (Willingness to Pay)', content: WTP_CONTENT },
  { slug: 'feature-demand', name: 'Feature Demand', content: FEATURE_DEMAND_CONTENT },
  { slug: 'value-prop', name: 'Value Proposition', content: VALUE_PROP_CONTENT },
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
