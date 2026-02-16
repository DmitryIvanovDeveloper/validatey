export const TYPES = {
  WorkspaceRepository: Symbol.for('WorkspaceRepository'),

  // Presenters
  WorkspaceListPresenter: Symbol.for('WorkspaceListPresenter'),

  // Use Cases
  CreateWorkspaceUseCase: Symbol.for('CreateWorkspaceUseCase'),
  ListWorkspacesUseCase: Symbol.for('ListWorkspacesUseCase'),
  GetWorkspaceUseCase: Symbol.for('GetWorkspaceUseCase'),
  UpdateWorkspaceUseCase: Symbol.for('UpdateWorkspaceUseCase'),
  DeleteWorkspaceUseCase: Symbol.for('DeleteWorkspaceUseCase'),
};