export const TYPES = {
  ProjectRepository: Symbol.for('ProjectRepository'),
  CreateProjectUseCase: Symbol.for('CreateProjectUseCase'),
  GetProjectUseCase: Symbol.for('GetProjectUseCase'),
  UpdateProjectUseCase: Symbol.for('UpdateProjectUseCase'),
  ListProjectsUseCase: Symbol.for('ListProjectsUseCase'),
  DeleteProjectUseCase: Symbol.for('DeleteProjectUseCase'),
  AssessProjectRiskUseCase: Symbol.for('AssessProjectRiskUseCase'),
  ProjectRiskAssessor: Symbol.for('ProjectRiskAssessor'),
  ProjectController: Symbol.for('ProjectController'),
} as const;

