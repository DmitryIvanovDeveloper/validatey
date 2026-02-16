import { injectable, inject } from 'inversify';
import type { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import type { DeleteProjectUseCase } from '../../application/use-cases/delete-project.use-case';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { Project, ProjectStatus } from '../../domain/entities/project.entity';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { sessionManager } from '../../../../shared/services/session-manager';

@injectable()
export class ProjectListPresenter {
  constructor(
    @inject(TYPES.ListProjectsUseCase)
    private readonly _listProjectsUseCase: ListProjectsUseCase,
    @inject(TYPES.DeleteProjectUseCase)
    private readonly _deleteProjectUseCase: DeleteProjectUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async loadProjects(viewModel: ProjectListViewModel, workspaceId?: string): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const userId = sessionManager.currentUserId;
    if (!userId) {
      viewModel.error.value = 'User not authenticated';
      viewModel.loading.value = false;
      this._logger.error('Failed to load projects: no user ID');
      return;
    }

    const result = await this._listProjectsUseCase.execute({ workspaceId });

    if (result.isSuccess) {
      // Map response to Project entities
      const projects = result.data.projects.map(p =>
        new Project(
          p.id,
          p.name,
          null,
          null,
          null,
          p.status as ProjectStatus,
          new Date(p.createdAt),
          new Date(p.updatedAt)
        )
      );
      viewModel.projects.value = projects;
      viewModel.loading.value = false;
      this._logger.info('Projects loaded', { userId, count: result.data.projects.length });
    } else {
      const message = result.error instanceof Error ? result.error.message : String(result.error);
      viewModel.error.value = message || 'Failed to load projects';
      viewModel.loading.value = false;
      this._logger.error('Failed to load projects', { userId, error: result.error });
    }
  }

  async deleteProject(viewModel: ProjectListViewModel, projectId: string, workspaceId?: string): Promise<boolean> {
    viewModel.deletingId.value = projectId;
    viewModel.error.value = null;

    const result = await this._deleteProjectUseCase.execute({ projectId });

    viewModel.deletingId.value = null;

    if (result.isSuccess) {
      this._logger.info('Project deleted', { projectId });
      await this.loadProjects(viewModel, workspaceId);
      return true;
    }

    const message = result.error instanceof Error ? result.error.message : String(result.error);
    viewModel.error.value = message || 'Failed to delete project';
    this._logger.error('Failed to delete project', { projectId, error: result.error });
    return false;
  }
}

