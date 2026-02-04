export const TYPES = {
  ScenarioRepository: Symbol.for('ScenarioRepository'),
  ScenarioTemplateRepository: Symbol.for('ScenarioTemplateRepository'),
  ScenarioRatingRepository: Symbol.for('ScenarioRatingRepository'),
  LLMService: Symbol.for('LLMService'),
  GenerateScenarioUseCase: Symbol.for('GenerateScenarioUseCase'),
  SaveScenarioVersionUseCase: Symbol.for('SaveScenarioVersionUseCase'),
  SaveScenarioRatingUseCase: Symbol.for('SaveScenarioRatingUseCase'),
  GetScenarioUseCase: Symbol.for('GetScenarioUseCase'),
  GetScenarioTemplatesUseCase: Symbol.for('GetScenarioTemplatesUseCase'),
  ScenarioPresenter: Symbol.for('ScenarioPresenter'),
} as const;



