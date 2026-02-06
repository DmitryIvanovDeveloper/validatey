export const TYPES = {
  ProjectRepository: Symbol.for('ProjectRepository'),
  CreateProjectUseCase: Symbol.for('CreateProjectUseCase'),
  GetProjectUseCase: Symbol.for('GetProjectUseCase'),
  UpdateProjectUseCase: Symbol.for('UpdateProjectUseCase'),
  ListProjectsUseCase: Symbol.for('ListProjectsUseCase'),
  DeleteProjectUseCase: Symbol.for('DeleteProjectUseCase'),
  ProjectController: Symbol.for('ProjectController'),
} as const;

