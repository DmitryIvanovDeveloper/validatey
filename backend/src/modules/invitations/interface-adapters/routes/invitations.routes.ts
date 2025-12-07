import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { InvitationPresenter } from '../presenters/invitation.presenter';

const router = Router();
const presenter = container.get<InvitationPresenter>(TYPES.InvitationPresenter);

// Create invitations
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await presenter.createInvitations({
      projectId: req.body.projectId,
      contacts: req.body.contacts,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get invitations by project
router.get('/project/:projectId', async (req: Request, res: Response) => {
  try {
    // TODO: Add GetInvitationsByProjectIdUseCase
    return res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Update invitation status
router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const result = await presenter.updateInvitationStatus({
      invitationId: req.params.id,
      status: req.body.status,
    });

    if (!result.isSuccess) {
      if (result.error.name === 'InvitationNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;


