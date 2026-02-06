import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { InvitationController } from '../controllers/invitation.controller';

const router = Router({ mergeParams: true });
const controller = container.get<InvitationController>(TYPES.InvitationController);

// POST /projects/:projectId/invitations
router.post('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const emails = req.body.emails || [];

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails array is required' });
    }

    const contacts = emails.map((email: string) => ({ email, phone: undefined }));

    const result = await controller.createInvitations({
      projectId,
      contacts,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// GET /projects/:projectId/invitations
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const result = await controller.getInvitationsByProjectId({ projectId });
    
    if (!result.isSuccess) {
      return res.status(500).json({ error: result.error.message });
    }
    
    return res.status(200).json(result.data.invitations);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /projects/:projectId/invitations/send
router.post('/send', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const invitationIds = Array.isArray(req.body.invitationIds) ? req.body.invitationIds : [];

    const surveyBaseUrl =
      (process.env.FRONTEND_ORIGIN || process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');

    const result = await controller.sendInvitations({
      projectId,
      invitationIds,
      surveyBaseUrl,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

