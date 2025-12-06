import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { InvitationPresenter } from '../presenters/invitation.presenter';

const router = Router({ mergeParams: true });
const presenter = container.get<InvitationPresenter>(TYPES.InvitationPresenter);

// POST /projects/:projectId/invitations
router.post('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const emails = req.body.emails || [];

    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ error: 'emails array is required' });
    }

    const contacts = emails.map((email: string) => ({ email, phone: undefined }));

    const result = await presenter.createInvitations({
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
    // TODO: Add GetInvitationsByProjectIdUseCase
    return res.status(501).json({ error: 'List invitations not implemented yet', projectId });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /projects/:projectId/invitations/send
router.post('/send', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId;
    const invitationIds = req.body.invitationIds || [];

    // TODO: Add SendInvitationsUseCase
    // This should:
    // 1. Queue email sending tasks
    // 2. Update invitation statuses to "sent"
    // 3. Create survey for each invitation based on scenario

    return res.status(501).json({ error: 'Send invitations not implemented yet', projectId, invitationIds });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

