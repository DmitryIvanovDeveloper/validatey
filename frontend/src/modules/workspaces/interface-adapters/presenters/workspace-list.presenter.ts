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
  readonly labels = {
    pageTitle: 'Workspaces',
    pageSubtitle: 'Organize your projects into workspaces',
    breadcrumbWorkspaces: 'Workspaces',
    newWorkspace: '+ New Workspace',
    loadingWorkspaces: 'Loading workspaces…',
    errorPresenterNotInitialized: 'ERROR: Presenter not initialized!',
    emptyTitle: 'Create your first workspace',
    emptyDescription: 'Workspaces help you organize your projects. Create your first workspace to get started.',
    createWorkspace: 'Create workspace',
    createProject: 'Create Project',
    edit: 'Edit',
    delete: 'Delete',
    deleting: 'Deleting...',
    editAria: (name: string) => `Edit ${name}`,
    deleteAria: (name: string) => `Delete ${name}`,
    createModalTitle: 'Create New Workspace',
    createModalIconLabel: 'Icon (optional)',
    createModalLoadIcon: 'Load icon',
    createModalNameLabel: 'Workspace Name',
    createModalNamePlaceholder: 'e.g. Product Validation, Marketing Research',
    createModalNameHelp: 'Choose a descriptive name for your workspace. You can change it later.',
    cancel: 'Cancel',
    createWorkspaceButton: 'Create Workspace',
    creating: 'Creating...',
    editModalTitle: 'Edit Workspace',
    editModalIconLabel: 'Icon',
    editModalNamePlaceholder: 'Workspace name',
    updateWorkspace: 'Update Workspace',
    updating: 'Updating...',
    deleteModalTitle: 'Delete Workspace',
    deleteModalConfirmTitle: 'Are you sure you want to delete this workspace?',
    deleteModalConfirmDescription: 'This action cannot be undone. This will permanently delete the',
    deleteModalConfirmSuffix: 'workspace and all associated projects.',
    deleteModalTypeConfirm: 'Type',
    deleteModalTypeConfirmSuffix: 'to delete this workspace:',
    deleteModalConfirmPlaceholder: 'confirm',
    deleteWorkspaceButton: 'Delete Workspace',
    deletingButton: 'Deleting...',
    cardOpenWorkspace: 'Open Workspace',
    cardCreated: 'Created',
    sidebarTitle: 'Workspaces',
    sidebarNewWorkspace: 'New workspace',
    sidebarAllWorkspaces: 'All workspaces',
    sidebarEdit: 'Edit',
    sidebarDelete: 'Delete',
    sidebarManageAria: (name: string) => `Manage ${name}`,
    errorLoadWorkspaces: 'Failed to load workspaces',
    errorCreateWorkspace: 'Failed to create workspace',
    errorUpdateWorkspace: 'Failed to update workspace',
    errorDeleteWorkspace: 'Failed to delete workspace',
    errorUploadIcon: 'Failed to upload icon',
    errorInvalidUploadResponse: 'Invalid upload response',
  };

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
      this.viewModel.error = error instanceof Error ? error.message : this.labels.errorLoadWorkspaces;
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
      this.viewModel.error = error instanceof Error ? error.message : this.labels.errorCreateWorkspace;
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
      this.viewModel.error = error instanceof Error ? error.message : this.labels.errorDeleteWorkspace;
      throw error;
    } finally {
      this.viewModel.deletingWorkspaceId = null;
    }
  }

  clearError(): void {
    this.viewModel.error = null;
  }
}