import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { SuggestMarketContextUseCase } from '../../application/use-cases/suggest-market-context.use-case';
import { AiModuleError } from '../../domain/errors/ai.error';

const router = Router();

/** POST /api/ai/market-context-suggest — AI suggestion for market picture, market fit, differentiation (search + LLM). */
router.post('/market-context-suggest', async (req: Request, res: Response) => {
  try {
    const segmentDescription = (req.body?.segmentDescription ?? '').trim();
    const segmentDemographics =
      typeof req.body?.segmentDemographics === 'string' ? req.body.segmentDemographics.trim() : undefined;
    const productDescription =
      typeof req.body?.productDescription === 'string' ? req.body.productDescription.trim() : undefined;

    const useCase = container.get<SuggestMarketContextUseCase>(TYPES.SuggestMarketContextUseCase);
    const result = await useCase.execute({
      segmentDescription,
      segmentDemographics,
      productDescription,
    });

    if (!result.isSuccess) {
      const err = result.error;
      const message = err instanceof AiModuleError ? err.message : 'Market context suggestion failed';
      const isMissingContext = message.includes('Provide segment or hypothesis');
      const isConfig = message.includes('not configured') || message.includes('SERPER_API_KEY');
      const status = isMissingContext ? 400 : isConfig ? 503 : 502;
      return res.status(status).json({
        error: message,
        hint: isConfig ? 'Set SERPER_API_KEY in environment to enable search.' : undefined,
      });
    }

    return res.status(200).json(result.data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

export default router;
