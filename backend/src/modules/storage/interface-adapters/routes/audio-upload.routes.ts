import { Router, Request, Response } from 'express';
import multer from 'multer';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { StorageController } from '../controllers/storage.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const controller = container.get<StorageController>(TYPES.StorageController);

// POST /api/audio-upload (frontend requirement)
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    // Extract userId from header (required for all requests)
    const userId = (req.headers['x-user-id'] || req.body?.userId) as string | undefined;
    if (!userId) {
      return res.status(400).json({ 
        error: 'x-user-id header is required',
        details: 'Missing x-user-id header in request'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const fileName = req.body?.fileName || req.file.originalname;
    const mimeType = req.body?.mimeType || req.file.mimetype;

    // Validate audio MIME types
    const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/ogg'];
    if (!allowedTypes.includes(mimeType) && !mimeType.startsWith('audio/')) {
      return res.status(400).json({ error: 'Invalid audio file type' });
    }

    const result = await controller.uploadFile({
      file: req.file.buffer,
      filename: fileName,
      contentType: mimeType,
      folder: 'audio', // Store in audio folder
    });

    if (!result.isSuccess) {
      return res.status(400).json({ error: result.error.message });
    }

    return res.status(200).json({
      url: result.data.file.url,
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;

