export type ScenarioTemplate = {
  slug: string;
  name: string;
  content: string;
};

export interface ScenarioTemplateRepositoryPort {
  list(): Promise<ScenarioTemplate[]>;
  getBySlug(slug: string): Promise<ScenarioTemplate | null>;
}
