import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TelemetryPresenter } from '../presenters/telemetry.presenter';

const router = Router();
const presenter = container.get<TelemetryPresenter>(TYPES.TelemetryPresenter);

// Submit telemetry (fast, non-blocking)
router.post('/', async (req: Request, res: Response) => {
  try {
    const result = await presenter.submitTelemetry({
      type: req.body.type,
      page: req.body.page,
      eventName: req.body.eventName,
      step: req.body.step,
      metadata: req.body.metadata,
      timestamp: req.body.timestamp,
    });

    if (!result.isSuccess) {
      // Don't fail the request, just log
      console.error('Telemetry submission failed:', result.error);
      return res.status(204).send();
    }

    return res.status(204).send();
  } catch (error) {
    // Telemetry should never block, always return success
    console.error('Telemetry error:', error);
    return res.status(204).send();
  }
});

export default router;


