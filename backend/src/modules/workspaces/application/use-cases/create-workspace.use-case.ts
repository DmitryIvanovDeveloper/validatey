import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { WorkspaceEntity } from '../../domain/entities/workspace.entity';
import { InvalidWorkspaceDataError } from '../../domain/errors/workspace.error';
import { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { CreateWorkspaceUseCaseRequest, CreateWorkspaceUseCaseResponse } from './input-output/create-workspace.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CreateWorkspaceUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.WorkspaceRepository)
    private readonly _repository: WorkspaceRepositoryPort
  ) {}

  async execute(
    request: CreateWorkspaceUseCaseRequest
  ): Promise<ResultEx<CreateWorkspaceUseCaseResponse, InvalidWorkspaceDataError>> {
    this._logger.info('create-workspace.start', { userId: request.userId, name: request.name });

    try {
      const workspace = WorkspaceEntity.create(
        request.userId,
        request.name
      );

      const saveResult = await this._repository.create(workspace.toData());

      if (!saveResult.isSuccess) {
        this._logger.error('create-workspace.repository-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      this._logger.info('create-workspace.success', { workspaceId: saveResult.data.id });

      return ResultEx.success({
        workspace: saveResult.data,
      });
    } catch (error) {
      this._logger.error('create-workspace.error', { error });
      if (error instanceof InvalidWorkspaceDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidWorkspaceDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}