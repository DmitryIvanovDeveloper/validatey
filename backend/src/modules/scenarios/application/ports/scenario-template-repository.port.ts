export type ScenarioTemplate = {
  slug: string;
  name: string;
  significanceTarget: number;
  content?: string; // Optional for backward compatibility
};

export interface ScenarioTemplateRepositoryPort {
  list(): Promise<ScenarioTemplate[]>;
  getBySlug(slug: string): Promise<ScenarioTemplate | null>;
}
