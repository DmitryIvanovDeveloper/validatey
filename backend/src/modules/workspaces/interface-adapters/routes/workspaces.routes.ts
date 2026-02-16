import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { WorkspaceController } from '../controllers/workspace.controller';

const router = Router();
const controller = container.get<WorkspaceController>(TYPES.WorkspaceController);

router.get('/', controller.listWorkspaces.bind(controller));
router.post('/', controller.createWorkspace.bind(controller));
router.get('/:workspaceId', controller.getWorkspace.bind(controller));
router.patch('/:workspaceId', controller.updateWorkspace.bind(controller));
router.delete('/:workspaceId', controller.deleteWorkspace.bind(controller));

export default router;