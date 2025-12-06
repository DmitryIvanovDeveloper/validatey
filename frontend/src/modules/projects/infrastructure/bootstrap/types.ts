export const TYPES = {
  ProjectRepository: Symbol.for('ProjectRepository'),
  CreateProjectUseCase: Symbol.for('CreateProjectUseCase'),
  GetProjectUseCase: Symbol.for('GetProjectUseCase'),
  ListProjectsUseCase: Symbol.for('ListProjectsUseCase'),
  UpdateProjectUseCase: Symbol.for('UpdateProjectUseCase'),
  ProjectPresenter: Symbol.for('ProjectPresenter'),
  ProjectListPresenter: Symbol.for('ProjectListPresenter'),
} as const;

