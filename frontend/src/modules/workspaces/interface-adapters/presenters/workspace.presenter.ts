import { inject, injectable } from 'inversify';
import { reactive } from 'vue';
import { GetWorkspaceUseCase } from '../../application/use-cases/get-workspace.use-case';
import { UpdateWorkspaceUseCase } from '../../application/use-cases/update-workspace.use-case';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { WorkspaceViewModel } from '../view-models/workspace.view-model';

@injectable()
export class WorkspacePresenter {
  public viewModel: WorkspaceViewModel = reactive({
    workspace: null,
    loading: false,
    error: null,
    updating: false,
  });

  constructor(
    @inject(TYPES.GetWorkspaceUseCase)
    private readonly _getWorkspaceUseCase: GetWorkspaceUseCase,
    @inject(TYPES.UpdateWorkspaceUseCase)
    private readonly _updateWorkspaceUseCase: UpdateWorkspaceUseCase
  ) {}

  async loadWorkspace(workspaceId: string, userId: string): Promise<void> {
    this.viewModel.loading = true;
    this.viewModel.error = null;

    try {
      const result = await this._getWorkspaceUseCase.execute({ workspaceId, userId });
      if (!result.isSuccess) {
        throw result.error;
      }
      this.viewModel.workspace = result.data.workspace;
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to load workspace';
      console.error('Failed to load workspace:', error);
    } finally {
      this.viewModel.loading = false;
    }
  }

  async updateWorkspace(workspaceId: string, userId: string, name: string): Promise<void> {
    this.viewModel.updating = true;
    this.viewModel.error = null;

    try {
      const result = await this._updateWorkspaceUseCase.execute({ workspaceId, userId, name });
      if (!result.isSuccess) {
        throw result.error;
      }
      this.viewModel.workspace = result.data.workspace;
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to update workspace';
      throw error;
    } finally {
      this.viewModel.updating = false;
    }
  }

  clearError(): void {
    this.viewModel.error = null;
  }
}