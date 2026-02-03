import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { InvitationPresenter } from '../presenters/invitation.presenter';

const router = Router();
const presenter = container.get<InvitationPresenter>(TYPES.InvitationPresenter);

// Get invitation by token (public endpoint)
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const result = await presenter.getInvitationByToken({
      token: req.params.token,
    });

    if (!result.isSuccess) {
      if (result.error.name === 'InvitationNotFoundError') {
        return res.status(404).json({ error: 'Invitation not found' });
      }
      return res.status(400).json({ error: result.error.message });
    }

    // Mark as opened when accessed
    if (result.data.invitation.status === 'sent') {
      await presenter.updateInvitationStatus({
        invitationId: result.data.invitation.id,
        status: 'opened',
      });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;



