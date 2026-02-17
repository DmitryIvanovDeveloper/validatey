import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

function getUserIdFromRequest(req: Request): string | undefined {
  return (req.body?.userId || req.headers['x-user-id']) as string | undefined;
}

// Use Cases
import { CreateWorkspaceUseCase } from '../../application/use-cases/create-workspace.use-case';
import { ListWorkspacesUseCase } from '../../application/use-cases/list-workspaces.use-case';
import { GetWorkspaceUseCase } from '../../application/use-cases/get-workspace.use-case';
import { UpdateWorkspaceUseCase } from '../../application/use-cases/update-workspace.use-case';
import { DeleteWorkspaceUseCase } from '../../application/use-cases/delete-workspace.use-case';

// I/O Types
import { CreateWorkspaceUseCaseRequest } from '../../application/use-cases/input-output/create-workspace.io';
import { ListWorkspacesUseCaseRequest } from '../../application/use-cases/input-output/list-workspaces.io';
import { GetWorkspaceUseCaseRequest } from '../../application/use-cases/input-output/get-workspace.io';
import { UpdateWorkspaceUseCaseRequest } from '../../application/use-cases/input-output/update-workspace.io';
import { DeleteWorkspaceUseCaseRequest } from '../../application/use-cases/input-output/delete-workspace.io';

// Types
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class WorkspaceController {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.CreateWorkspaceUseCase)
    private readonly _createWorkspaceUseCase: CreateWorkspaceUseCase,
    @inject(TYPES.ListWorkspacesUseCase)
    private readonly _listWorkspacesUseCase: ListWorkspacesUseCase,
    @inject(TYPES.GetWorkspaceUseCase)
    private readonly _getWorkspaceUseCase: GetWorkspaceUseCase,
    @inject(TYPES.UpdateWorkspaceUseCase)
    private readonly _updateWorkspaceUseCase: UpdateWorkspaceUseCase,
    @inject(TYPES.DeleteWorkspaceUseCase)
    private readonly _deleteWorkspaceUseCase: DeleteWorkspaceUseCase
  ) {}

  async createWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const request: CreateWorkspaceUseCaseRequest = {
        userId,
        name: req.body.name,
      };

      const result = await this._createWorkspaceUseCase.execute(request);

      if (!result.isSuccess) {
        this._logger.error('workspace-controller.create-workspace-error', { error: result.error });
        res.status(400).json({ error: result.error.message });
        return;
      }

      res.status(201).json(result.data);
    } catch (error) {
      this._logger.error('workspace-controller.create-workspace-exception', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async listWorkspaces(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const request: ListWorkspacesUseCaseRequest = {
        userId,
      };

      const result = await this._listWorkspacesUseCase.execute(request);

      if (!result.isSuccess) {
        this._logger.error('workspace-controller.list-workspaces-error', { error: result.error });
        res.status(500).json({ error: 'Failed to list workspaces' });
        return;
      }

      res.status(200).json(result.data);
    } catch (error) {
      this._logger.error('workspace-controller.list-workspaces-exception', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workspaceId = req.params.workspaceId;
      if (!workspaceId) {
        res.status(400).json({ error: 'Workspace ID is required' });
        return;
      }

      const request: GetWorkspaceUseCaseRequest = {
        workspaceId,
        userId,
      };

      const result = await this._getWorkspaceUseCase.execute(request);

      if (!result.isSuccess) {
        this._logger.error('workspace-controller.get-workspace-error', { workspaceId, error: result.error });

        if (result.error.name === 'WorkspaceNotFoundError') {
          res.status(404).json({ error: 'Workspace not found' });
          return;
        }

        if (result.error.name === 'WorkspaceAccessDeniedError') {
          res.status(403).json({ error: 'Access denied' });
          return;
        }

        res.status(500).json({ error: 'Failed to get workspace' });
        return;
      }

      res.status(200).json(result.data);
    } catch (error) {
      this._logger.error('workspace-controller.get-workspace-exception', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workspaceId = req.params.workspaceId;
      if (!workspaceId) {
        res.status(400).json({ error: 'Workspace ID is required' });
        return;
      }

      const request: UpdateWorkspaceUseCaseRequest = {
        workspaceId,
        userId,
        name: req.body.name,
        iconUrl: req.body.iconUrl,
      };

      const result = await this._updateWorkspaceUseCase.execute(request);

      if (!result.isSuccess) {
        this._logger.error('workspace-controller.update-workspace-error', { workspaceId, error: result.error });

        if (result.error.name === 'WorkspaceNotFoundError') {
          res.status(404).json({ error: 'Workspace not found' });
          return;
        }

        if (result.error.name === 'WorkspaceAccessDeniedError') {
          res.status(403).json({ error: 'Access denied' });
          return;
        }

        res.status(400).json({ error: result.error.message });
        return;
      }

      res.status(200).json(result.data);
    } catch (error) {
      this._logger.error('workspace-controller.update-workspace-exception', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async deleteWorkspace(req: Request, res: Response): Promise<void> {
    try {
      const userId = getUserIdFromRequest(req);
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const workspaceId = req.params.workspaceId;
      if (!workspaceId) {
        res.status(400).json({ error: 'Workspace ID is required' });
        return;
      }

      const request: DeleteWorkspaceUseCaseRequest = {
        workspaceId,
        userId,
        confirmText: req.headers.confirmtext as string,
      };

      const result = await this._deleteWorkspaceUseCase.execute(request);

      if (!result.isSuccess) {
        this._logger.error('workspace-controller.delete-workspace-error', { workspaceId, error: result.error });

        if (result.error.name === 'WorkspaceNotFoundError') {
          res.status(404).json({ error: 'Workspace not found' });
          return;
        }

        if (result.error.name === 'WorkspaceAccessDeniedError') {
          res.status(403).json({ error: 'Access denied' });
          return;
        }

        res.status(400).json({ error: result.error.message });
        return;
      }

      res.status(200).json(result.data);
    } catch (error) {
      this._logger.error('workspace-controller.delete-workspace-exception', { error });
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}