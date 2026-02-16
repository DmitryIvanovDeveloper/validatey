export const TYPES = {
  WorkspaceRepository: Symbol.for('WorkspaceRepository'),
  WorkspaceController: Symbol.for('WorkspaceController'),

  // Use Cases
  CreateWorkspaceUseCase: Symbol.for('CreateWorkspaceUseCase'),
  ListWorkspacesUseCase: Symbol.for('ListWorkspacesUseCase'),
  GetWorkspaceUseCase: Symbol.for('GetWorkspaceUseCase'),
  UpdateWorkspaceUseCase: Symbol.for('UpdateWorkspaceUseCase'),
  DeleteWorkspaceUseCase: Symbol.for('DeleteWorkspaceUseCase'),
};