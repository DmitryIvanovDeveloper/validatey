export interface Workspace {
  id: string;
  userId: string;
  name: string;
  iconUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceListViewModel {
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  creatingWorkspace: boolean;
  updatingWorkspaceId: string | null;
  deletingWorkspaceId: string | null;
}