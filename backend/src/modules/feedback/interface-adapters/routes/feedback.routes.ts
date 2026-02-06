import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as FEEDBACK_TYPES } from '../../infrastructure/bootstrap/types';
import { SubmitFeedbackUseCase } from '../../application/use-cases/submit-feedback.use-case';
import { FeedbackValidationError } from '../../domain/errors/feedback.error';
import { SupabaseAuthProvider } from '../../../auth/infrastructure/supabase-auth-provider';

const router = Router();
const authProvider = new SupabaseAuthProvider();
const COOKIE_NAME = 'validatey_auth';

/** POST /api/feedback — submit feedback (authenticated). Body: { type, text, page_url?, screenshot_url? } */
router.post('/', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: 'No session' });
    }

    const user = await authProvider.getUserFromAccessToken(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }

    const { type, text, page_url: pageUrl, screenshot_url: screenshotUrl } = req.body ?? {};
    const submitUseCase = container.get<SubmitFeedbackUseCase>(FEEDBACK_TYPES.SubmitFeedbackUseCase);
    const result = await submitUseCase.execute({
      type,
      text,
      pageUrl: pageUrl ?? null,
      screenshotUrl: screenshotUrl ?? null,
      callerUserId: user.id,
    });

    if (!result.isSuccess) {
      if (result.error instanceof FeedbackValidationError) {
        return res.status(400).json({ error: result.error.message });
      }
      return res.status(500).json({ error: result.error instanceof Error ? result.error.message : 'Unknown error' });
    }

    return res.status(201).json({ id: result.data.id });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Unknown error' });
  }
});

export default router;
