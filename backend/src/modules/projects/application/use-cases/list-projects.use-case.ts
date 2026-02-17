import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ListProjectsUseCaseRequest, ListProjectsUseCaseResponse } from './input-output/list-projects.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { Project } from '../../domain/entities/project.entity';

@injectable()
export class ListProjectsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(request: ListProjectsUseCaseRequest): Promise<ResultEx<ListProjectsUseCaseResponse, Error>> {
    this._logger.info('list-projects.start', {
      userId: request.userId,
      listAll: request.listAll,
      workspaceId: request.workspaceId
    });

    let findResult: ResultEx<Project[], Error>;

    if (request.listAll) {
      findResult = await this._repository.findAll();
    } else if (request.workspaceId) {
      findResult = await this._repository.findByWorkspaceId(request.workspaceId);
    } else {
      findResult = await this._repository.findByUserId(request.userId);
    }

    if (!findResult.isSuccess) {
      this._logger.error('list-projects.error', { error: findResult.error });
      return ResultEx.failure(findResult.error);
    }

    this._logger.info('list-projects.success', {
      userId: request.userId,
      workspaceId: request.workspaceId,
      count: findResult.data.length
    });

    return ResultEx.success({
      projects: findResult.data,
    });
  }
}



