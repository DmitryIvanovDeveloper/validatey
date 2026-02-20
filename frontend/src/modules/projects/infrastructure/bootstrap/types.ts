export const TYPES = {
  ProjectRepository: Symbol.for('ProjectRepository'),
  ProjectRiskRepository: Symbol.for('ProjectRiskRepository'),
  MarketContextRepository: Symbol.for('MarketContextRepository'),
  CreateProjectUseCase: Symbol.for('CreateProjectUseCase'),
  GetProjectUseCase: Symbol.for('GetProjectUseCase'),
  ListProjectsUseCase: Symbol.for('ListProjectsUseCase'),
  UpdateProjectUseCase: Symbol.for('UpdateProjectUseCase'),
  DeleteProjectUseCase: Symbol.for('DeleteProjectUseCase'),
  AssessProjectRiskUseCase: Symbol.for('AssessProjectRiskUseCase'),
  GetMarketContextSuggestionUseCase: Symbol.for('GetMarketContextSuggestionUseCase'),
  ProjectPresenter: Symbol.for('ProjectPresenter'),
  ProjectListPresenter: Symbol.for('ProjectListPresenter'),
} as const;



