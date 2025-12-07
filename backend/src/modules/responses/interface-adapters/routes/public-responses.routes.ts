import { Router, Request, Response } from 'express';
import multer from 'multer';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ResponsePresenter } from '../presenters/response.presenter';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const presenter = container.get<ResponsePresenter>(TYPES.ResponsePresenter);

// Submit response (public endpoint by token)
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const token = req.body.token || req.query.token;
    if (!token) {
      return res.status(400).json({ error: 'Invitation token is required' });
    }

    const audioFile = req.file
      ? {
          buffer: req.file.buffer,
          filename: req.file.originalname,
          contentType: req.file.mimetype,
        }
      : undefined;

    const result = await presenter.submitResponse({
      invitationToken: token,
      answers: req.body.answers || JSON.parse(req.body.answers || '{}'),
      audioFile,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;


