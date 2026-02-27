export const TYPES = {
  ProjectRepository: Symbol.for('ProjectRepository'),
  ProjectOverviewRepository: Symbol.for('ProjectOverviewRepository'),
  ProjectRiskRepository: Symbol.for('ProjectRiskRepository'),
  MarketContextRepository: Symbol.for('MarketContextRepository'),
  CreateProjectUseCase: Symbol.for('CreateProjectUseCase'),
  GetProjectUseCase: Symbol.for('GetProjectUseCase'),
  GetPublicProjectMetaBySlugUseCase: Symbol.for('GetPublicProjectMetaBySlugUseCase'),
  GetProjectOverviewUseCase: Symbol.for('GetProjectOverviewUseCase'),
  ListProjectsUseCase: Symbol.for('ListProjectsUseCase'),
  UpdateProjectUseCase: Symbol.for('UpdateProjectUseCase'),
  DeleteProjectUseCase: Symbol.for('DeleteProjectUseCase'),
  AssessProjectRiskUseCase: Symbol.for('AssessProjectRiskUseCase'),
  GetMarketContextSuggestionUseCase: Symbol.for('GetMarketContextSuggestionUseCase'),
  SuggestSurveyPlatformsUseCase: Symbol.for('SuggestSurveyPlatformsUseCase'),
  ProjectPresenter: Symbol.for('ProjectPresenter'),
  ProjectListPresenter: Symbol.for('ProjectListPresenter'),
} as const;



