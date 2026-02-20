import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { CreateProjectUseCase } from '../../application/use-cases/create-project.use-case';
import { GetProjectUseCase } from '../../application/use-cases/get-project.use-case';
import { UpdateProjectUseCase } from '../../application/use-cases/update-project.use-case';
import { ListProjectsUseCase } from '../../application/use-cases/list-projects.use-case';
import { DeleteProjectUseCase } from '../../application/use-cases/delete-project.use-case';
import { AssessProjectRiskUseCase } from '../../application/use-cases/assess-project-risk.use-case';
import { CreateProjectUseCaseRequest } from '../../application/use-cases/input-output/create-project.io';
import { GetProjectUseCaseRequest } from '../../application/use-cases/input-output/get-project.io';
import { UpdateProjectUseCaseRequest } from '../../application/use-cases/input-output/update-project.io';
import { ListProjectsUseCaseRequest } from '../../application/use-cases/input-output/list-projects.io';
import { DeleteProjectUseCaseRequest } from '../../application/use-cases/input-output/delete-project.io';
import { AssessProjectRiskRequest } from '../../application/use-cases/input-output/assess-project-risk.io';

@injectable()
export class ProjectController {
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
		private readonly _deleteProjectUseCase: DeleteProjectUseCase,
		@inject(TYPES.AssessProjectRiskUseCase)
		private readonly _assessProjectRiskUseCase: AssessProjectRiskUseCase
	) {}

	public async createProject(request: CreateProjectUseCaseRequest): Promise<ReturnType<CreateProjectUseCase['execute']>> {
		return this._createProjectUseCase.execute(request);
	}

	public async getProject(request: GetProjectUseCaseRequest): Promise<ReturnType<GetProjectUseCase['execute']>> {
		return this._getProjectUseCase.execute(request);
	}

	public async updateProject(request: UpdateProjectUseCaseRequest): Promise<ReturnType<UpdateProjectUseCase['execute']>> {
		return this._updateProjectUseCase.execute(request);
	}

	public async listProjects(request: ListProjectsUseCaseRequest): Promise<ReturnType<ListProjectsUseCase['execute']>> {
		return this._listProjectsUseCase.execute(request);
	}

	public async deleteProject(request: DeleteProjectUseCaseRequest): Promise<ReturnType<DeleteProjectUseCase['execute']>> {
		return this._deleteProjectUseCase.execute(request);
	}

	public async assessProjectRisk(request: AssessProjectRiskRequest): Promise<ReturnType<AssessProjectRiskUseCase['execute']>> {
		return this._assessProjectRiskUseCase.execute(request);
	}
}
