export class WorkspaceNotFoundError extends Error {
  constructor(workspaceId: string) {
    super(`Workspace with id "${workspaceId}" not found`);
    this.name = 'WorkspaceNotFoundError';
  }
}

export class InvalidWorkspaceDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidWorkspaceDataError';
  }
}

export class WorkspaceAccessDeniedError extends Error {
  constructor(workspaceId: string, userId: string) {
    super(`User "${userId}" does not have access to workspace "${workspaceId}"`);
    this.name = 'WorkspaceAccessDeniedError';
  }
}