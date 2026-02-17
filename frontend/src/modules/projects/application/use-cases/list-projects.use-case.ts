import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ListProjectsUseCaseRequest, ListProjectsUseCaseResponse } from './input-output/list-projects.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectListError } from '../../domain/errors/project.error';
import type { Project } from '../../domain/entities/project.entity';

@injectable()
export class ListProjectsUseCase {
  constructor(
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(input: ListProjectsUseCaseRequest): Promise<Result<ListProjectsUseCaseResponse, ProjectListError>> {
    const result = input.workspaceId
      ? await this._repository.listByWorkspace(input.workspaceId)
      : await this._repository.list();

    if (!result.isSuccess) {
      return Result.failure(result.error);
    }

    const projects = result.data;

    return Result.success({
      projects: projects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      }))
    });
  }
}

