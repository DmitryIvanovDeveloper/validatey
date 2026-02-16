import { inject, injectable } from 'inversify';
import { reactive } from 'vue';
import { ListWorkspacesUseCase } from '../../application/use-cases/list-workspaces.use-case';
import { CreateWorkspaceUseCase } from '../../application/use-cases/create-workspace.use-case';
import { UpdateWorkspaceUseCase } from '../../application/use-cases/update-workspace.use-case';
import { DeleteWorkspaceUseCase } from '../../application/use-cases/delete-workspace.use-case';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { WorkspaceListViewModel, Workspace } from '../view-models/workspace-list.view-model';
import { sessionManager } from '../../../../shared/services/session-manager';

@injectable()
export class WorkspaceListPresenter {
  public viewModel: WorkspaceListViewModel = reactive({
    workspaces: [],
    loading: false,
    error: null,
    creatingWorkspace: false,
    updatingWorkspaceId: null,
    deletingWorkspaceId: null,
  });

  constructor(
    @inject(TYPES.ListWorkspacesUseCase)
    private readonly _listWorkspacesUseCase: ListWorkspacesUseCase,
    @inject(TYPES.CreateWorkspaceUseCase)
    private readonly _createWorkspaceUseCase: CreateWorkspaceUseCase,
    @inject(TYPES.UpdateWorkspaceUseCase)
    private readonly _updateWorkspaceUseCase: UpdateWorkspaceUseCase,
    @inject(TYPES.DeleteWorkspaceUseCase)
    private readonly _deleteWorkspaceUseCase: DeleteWorkspaceUseCase
  ) {}

  async loadWorkspaces(): Promise<void> {
    const userId = sessionManager.currentUserId;
    if (!userId) {
      this.viewModel.workspaces = [];
      this.viewModel.loading = false;
      return;
    }
    this.viewModel.loading = true;
    this.viewModel.error = null;

    try {
      const result = await this._listWorkspacesUseCase.execute({ userId });
      if (!result.isSuccess) {
        throw result.error;
      }
      this.viewModel.workspaces = result.data.workspaces;
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to load workspaces';
    } finally {
      this.viewModel.loading = false;
    }
  }

  async createWorkspace(name: string): Promise<Workspace | null> {
    const userId = sessionManager.currentUserId ?? '';
    this.viewModel.creatingWorkspace = true;
    this.viewModel.error = null;

    try {
      const result = await this._createWorkspaceUseCase.execute({ userId, name });
      if (!result.isSuccess) {
        throw result.error;
      }
      const workspace = result.data.workspace;
      this.viewModel.workspaces.push(workspace);
      await this.loadWorkspaces();
      return workspace;
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to create workspace';
      throw error;
    } finally {
      this.viewModel.creatingWorkspace = false;
    }
  }

  async updateWorkspace(workspaceId: string, name: string, iconUrl?: string | null): Promise<void> {
    const userId = sessionManager.currentUserId;
    if (!userId) return;
    this.viewModel.updatingWorkspaceId = workspaceId;
    this.viewModel.error = null;

    try {
      const result = await this._updateWorkspaceUseCase.execute({ workspaceId, userId, name, iconUrl });
      if (!result.isSuccess) {
        throw result.error;
      }

      // Update the workspace in the list
      const index = this.viewModel.workspaces.findIndex(w => w.id === workspaceId);
      if (index !== -1) {
        this.viewModel.workspaces[index] = result.data.workspace;
      }
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to update workspace';
      throw error;
    } finally {
      this.viewModel.updatingWorkspaceId = null;
    }
  }

  async updateWorkspaceIcon(workspaceId: string, iconUrl: string | null): Promise<void> {
    const workspace = this.viewModel.workspaces.find(w => w.id === workspaceId);
    if (!workspace) return;
    await this.updateWorkspace(workspaceId, workspace.name, iconUrl);
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    const userId = sessionManager.currentUserId ?? '';
    this.viewModel.deletingWorkspaceId = workspaceId;
    this.viewModel.error = null;

    try {
      await this._deleteWorkspaceUseCase.execute({
        workspaceId,
        userId,
        confirmText: 'confirm'
      });

      // Remove the workspace from the list
      this.viewModel.workspaces = this.viewModel.workspaces.filter(w => w.id !== workspaceId);
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to delete workspace';
      throw error;
    } finally {
      this.viewModel.deletingWorkspaceId = null;
    }
  }

  clearError(): void {
    this.viewModel.error = null;
  }
}