import { Router, Request, Response } from 'express';
import multer from 'multer';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { StoragePresenter } from '../presenters/storage.presenter';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const presenter = container.get<StoragePresenter>(TYPES.StoragePresenter);

// Upload file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const result = await presenter.uploadFile({
      file: req.file.buffer,
      filename: req.file.originalname,
      contentType: req.file.mimetype,
      folder: req.body.folder,
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get file URL by path (using query parameter)
router.get('/url', async (req: Request, res: Response) => {
  try {
    const path = req.query.path as string;
    if (!path) {
      return res.status(400).json({ error: 'Path query parameter is required' });
    }
    // TODO: Add GetFileUrlUseCase
    return res.status(501).json({ error: 'Not implemented yet', path });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Delete file by path (using query parameter)
router.delete('/file', async (req: Request, res: Response) => {
  try {
    const path = req.query.path as string;
    if (!path) {
      return res.status(400).json({ error: 'Path query parameter is required' });
    }
    // TODO: Add DeleteFileUseCase
    return res.status(501).json({ error: 'Not implemented yet', path });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

