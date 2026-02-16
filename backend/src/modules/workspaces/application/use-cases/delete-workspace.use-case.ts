import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { WorkspaceRepositoryPort } from '../ports/workspace-repository.port';
import { WorkspaceNotFoundError, WorkspaceAccessDeniedError, InvalidWorkspaceDataError } from '../../domain/errors/workspace.error';
import { DeleteWorkspaceUseCaseRequest, DeleteWorkspaceUseCaseResponse } from './input-output/delete-workspace.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';

@injectable()
export class DeleteWorkspaceUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.WorkspaceRepository)
    private readonly _workspaceRepository: WorkspaceRepositoryPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort
  ) {}

  async execute(request: DeleteWorkspaceUseCaseRequest): Promise<ResultEx<DeleteWorkspaceUseCaseResponse, WorkspaceNotFoundError | WorkspaceAccessDeniedError | InvalidWorkspaceDataError>> {
    this._logger.info('delete-workspace.start', {
      workspaceId: request.workspaceId,
      userId: request.userId,
      confirmText: request.confirmText
    });

    // Validate confirmation text
    if (request.confirmText !== 'confirm') {
      this._logger.warn('delete-workspace.invalid-confirmation', {
        workspaceId: request.workspaceId,
        confirmText: request.confirmText
      });
      return ResultEx.failure(new InvalidWorkspaceDataError('Confirmation text must be "confirm"'));
    }

    // First, get the existing workspace
    const findResult = await this._workspaceRepository.findById(request.workspaceId);

    if (!findResult.isSuccess) {
      this._logger.error('delete-workspace.not-found', { workspaceId: request.workspaceId, error: findResult.error });
      return ResultEx.failure(findResult.error);
    }

    // Check access control - workspace belongs to the requesting user
    if (findResult.data.userId !== request.userId) {
      this._logger.warn('delete-workspace.access-denied', {
        workspaceId: request.workspaceId,
        userId: request.userId,
        workspaceOwnerId: findResult.data.userId
      });
      return ResultEx.failure(new WorkspaceAccessDeniedError(request.workspaceId, request.userId));
    }

    // Find all projects in this workspace
    const projectsResult = await this._projectRepository.findByUserId(request.userId);
    if (!projectsResult.isSuccess) {
      this._logger.error('delete-workspace.find-projects-error', {
        workspaceId: request.workspaceId,
        error: projectsResult.error
      });
      return ResultEx.failure(new InvalidWorkspaceDataError('Failed to find projects in workspace'));
    }

    // Filter projects by workspace_id
    const workspaceProjects = projectsResult.data.filter(p => p.workspaceId === request.workspaceId);

    // Delete all projects in the workspace
    for (const project of workspaceProjects) {
      this._logger.info('delete-workspace.deleting-project', {
        workspaceId: request.workspaceId,
        projectId: project.id
      });

      const deleteProjectResult = await this._projectRepository.delete(project.id);
      if (!deleteProjectResult.isSuccess) {
        this._logger.error('delete-workspace.delete-project-error', {
          workspaceId: request.workspaceId,
          projectId: project.id,
          error: deleteProjectResult.error
        });
        return ResultEx.failure(new InvalidWorkspaceDataError(`Failed to delete project ${project.id}: ${deleteProjectResult.error.message}`));
      }
    }

    // Delete the workspace itself
    const deleteWorkspaceResult = await this._workspaceRepository.delete(request.workspaceId);

    if (!deleteWorkspaceResult.isSuccess) {
      this._logger.error('delete-workspace.repository-error', { error: deleteWorkspaceResult.error });
      return ResultEx.failure(deleteWorkspaceResult.error);
    }

    this._logger.info('delete-workspace.success', {
      workspaceId: request.workspaceId,
      deletedProjectsCount: workspaceProjects.length
    });

    return ResultEx.success({
      deleted: true,
    });
  }
}