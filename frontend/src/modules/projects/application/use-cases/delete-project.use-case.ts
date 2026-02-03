import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { DeleteProjectUseCaseRequest, DeleteProjectUseCaseResponse } from './input-output/delete-project.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectNotFoundError, ProjectListError } from '../../domain/errors/project.error';

@injectable()
export class DeleteProjectUseCase {
  constructor(
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(
    input: DeleteProjectUseCaseRequest
  ): Promise<Result<DeleteProjectUseCaseResponse, ProjectNotFoundError | ProjectListError>> {
    return this._repository.delete(input.projectId);
  }
}
