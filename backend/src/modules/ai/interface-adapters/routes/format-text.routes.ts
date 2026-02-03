import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { FormatTextUseCase } from '../../application/use-cases/format-text.use-case';

const router = Router();

/** POST /api/ai/format-text — format text via Cerebras LLM. */
router.post('/format-text', async (req: Request, res: Response) => {
  try {
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const useCase = container.get<FormatTextUseCase>(TYPES.FormatTextUseCase);
    const result = await useCase.execute({ text });

    if (!result.isSuccess) {
      return res.status(502).json({ error: result.error.message });
    }

    return res.status(200).json({ formatted: result.data.formatted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

export default router;
