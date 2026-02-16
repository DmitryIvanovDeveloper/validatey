export interface Workspace {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceViewModel {
  workspace: Workspace | null;
  loading: boolean;
  error: string | null;
  updating: boolean;
}