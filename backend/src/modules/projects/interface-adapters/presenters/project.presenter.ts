import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { DeleteProjectUseCase } from '../../application/use-cases/delete-project.use-case';
import { CreateProjectUseCaseRequest } from '../../application/use-cases/input-output/create-project.io';
import { GetProjectUseCaseRequest } from '../../application/use-cases/input-output/get-project.io';
import { UpdateProjectUseCaseRequest } from '../../application/use-cases/input-output/update-project.io';
import { ListProjectsUseCaseRequest } from '../../application/use-cases/input-output/list-projects.io';
import { DeleteProjectUseCaseRequest } from '../../application/use-cases/input-output/delete-project.io';

@injectable()
export class ProjectPresenter {
  constructor(
    @inject(TYPES.CreateProjectUseCase)
    private readonly _createProjectUseCase: CreateProjectUseCase,
    @inject(TYPES.GetProjectUseCase)
    private readonly _getProjectUseCase: GetProjectUseCase,
    @inject(TYPES.UpdateProjectUseCase)
    private readonly _updateProjectUseCase: UpdateProjectUseCase,
    @inject(TYPES.ListProjectsUseCase)
    private readonly _listProjectsUseCase: ListProjectsUseCase,
    @inject(TYPES.DeleteProjectUseCase)
    private readonly _deleteProjectUseCase: DeleteProjectUseCase
  ) {}

  async createProject(request: CreateProjectUseCaseRequest) {
    return await this._createProjectUseCase.execute(request);
  }

  async getProject(request: GetProjectUseCaseRequest) {
    return await this._getProjectUseCase.execute(request);
  }

  async updateProject(request: UpdateProjectUseCaseRequest) {
    return await this._updateProjectUseCase.execute(request);
  }

  async listProjects(request: ListProjectsUseCaseRequest) {
    return await this._listProjectsUseCase.execute(request);
  }

  async deleteProject(request: DeleteProjectUseCaseRequest) {
    return await this._deleteProjectUseCase.execute(request);
  }
}



