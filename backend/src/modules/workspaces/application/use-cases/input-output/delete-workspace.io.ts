export type DeleteWorkspaceUseCaseRequest = {
  workspaceId: string;
  userId: string; // for access control
  confirmText: string; // must be "confirm" for safety
};

export type DeleteWorkspaceUseCaseResponse = {
  deleted: boolean;
};