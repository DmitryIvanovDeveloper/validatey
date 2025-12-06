import { injectable, inject } from 'inversify';
import type { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { ProjectListViewModel } from '../view-models/project-list.view-model';
import { Project, ProjectStatus } from '../../domain/entities/project.entity';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

@injectable()
export class ProjectListPresenter {
  constructor(
    @inject(TYPES.ListProjectsUseCase)
    private readonly _listProjectsUseCase: ListProjectsUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async loadProjects(viewModel: ProjectListViewModel): Promise<void> {
    viewModel.loading.value = true;
    viewModel.error.value = null;

    const result = await this._listProjectsUseCase.execute({});

    if (result.isSuccess) {
      // Map response to Project entities
      const projects = result.data.projects.map(p => 
        new Project(
          p.id,
          p.name,
          null,
          null,
          p.status as ProjectStatus,
          new Date(p.createdAt),
          new Date(p.updatedAt)
        )
      );
      viewModel.projects.value = projects;
      viewModel.loading.value = false;
      this._logger.info('Projects loaded', { count: result.data.projects.length });
    } else {
      viewModel.error.value = 'Failed to load projects';
      viewModel.loading.value = false;
      this._logger.error('Failed to load projects', { error: result.error });
    }
  }
}

