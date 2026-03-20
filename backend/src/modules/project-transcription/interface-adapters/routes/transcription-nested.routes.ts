import { Router, Request, Response } from 'express';
import multer from 'multer';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ProjectTranscriptionController } from '../controllers/project-transcription.controller';

const router = Router({ mergeParams: true });
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});
const controller = container.get<ProjectTranscriptionController>(TYPES.ProjectTranscriptionController);

/** GET /api/projects/:projectId/transcription */
router.get('/', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = (req.headers['x-user-id'] as string) || '';

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limitRaw = req.query.limit;
    const offsetRaw = req.query.offset;
    const limit = typeof limitRaw === 'string' ? Math.min(100, Math.max(1, parseInt(limitRaw, 10) || 50)) : 50;
    const offset = typeof offsetRaw === 'string' ? Math.max(0, parseInt(offsetRaw, 10) || 0) : 0;

    const result = await controller.list({ projectId, userId, limit, offset });

    if (!result.isSuccess) {
      const err = result.error;
      if (err.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: err.message });
      }
      if (err.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }

    return res.status(200).json({
      items: result.data.map((e) => e.toJson()),
    });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/** GET /api/projects/:projectId/transcription/insights */
router.get('/insights', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = (req.headers['x-user-id'] as string) || '';
    if (!projectId) return res.status(400).json({ error: 'Project ID is required' });
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const result = await controller.getInsights({ projectId, userId });
    if (!result.isSuccess) {
      const err = result.error;
      if (err.name === 'ProjectNotFoundError') return res.status(404).json({ error: err.message });
      if (err.name === 'ProjectAccessDeniedError') return res.status(403).json({ error: err.message });
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/** POST /api/projects/:projectId/transcription — multipart field "audio" */
router.post('/', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = (req.headers['x-user-id'] as string) || '';

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'Audio file is required (field: audio)' });
    }

    const mimeType = req.file.mimetype || 'application/octet-stream';
    const originalFilename = req.file.originalname || 'audio';
    const language = typeof req.body?.language === 'string' ? req.body.language : undefined;

    const result = await controller.transcribe({
      projectId,
      userId,
      buffer: req.file.buffer,
      mimeType,
      originalFilename,
      language,
    });

    if (!result.isSuccess) {
      const err = result.error;
      if (err.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: err.message });
      }
      if (err.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: err.message });
      }
      if (err.name === 'AudioFileTooLargeError' || err.name === 'InvalidAudioFileError') {
        return res.status(400).json({ error: err.message });
      }
      if (err.name === 'DuplicateTranscriptionFileError') {
        return res.status(409).json({ error: err.message });
      }
      if (err.name === 'SpeechToTextProviderError') {
        return res.status(502).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/** DELETE /api/projects/:projectId/transcription/:transcriptionId */
router.delete('/:transcriptionId', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const transcriptionId = req.params.transcriptionId as string;
    const userId = (req.headers['x-user-id'] as string) || '';

    if (!projectId || !transcriptionId) {
      return res.status(400).json({ error: 'Project ID and transcription ID are required' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await controller.delete({ projectId, userId, transcriptionId });

    if (!result.isSuccess) {
      const err = result.error;
      if (err.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: err.message });
      }
      if (err.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: err.message });
      }
      if (err.name === 'ProjectTranscriptionNotFoundError') {
        return res.status(404).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

/** POST /api/projects/:projectId/transcription/insights */
router.post('/insights', async (req: Request, res: Response) => {
  try {
    const projectId = req.params.projectId as string;
    const userId = (req.headers['x-user-id'] as string) || '';
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await controller.generateInsights({ projectId, userId });
    if (!result.isSuccess) {
      const err = result.error;
      if (err.name === 'ProjectNotFoundError') {
        return res.status(404).json({ error: err.message });
      }
      if (err.name === 'ProjectAccessDeniedError') {
        return res.status(403).json({ error: err.message });
      }
      if (err.name === 'NoTranscriptionsForInsightsError') {
        return res.status(400).json({ error: err.message });
      }
      if (err.name === 'TranscriptionInsightsGenerationError') {
        return res.status(502).json({ error: err.message });
      }
      return res.status(500).json({ error: err.message });
    }

    return res.status(200).json(result.data);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;
