import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as CONSENT_TYPES } from '../../../consents/infrastructure/bootstrap/types';
import { SurveyPresenter } from '../presenters/survey.presenter';
import { ConsentPresenter } from '../../../consents/interface-adapters/presenters/consent.presenter';

const router = Router();
const presenter = container.get<SurveyPresenter>(TYPES.SurveyPresenter);
const consentPresenter = container.get<ConsentPresenter>(CONSENT_TYPES.ConsentPresenter);

// GET /survey/:token
router.get('/:token', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    console.log('📋 GET /survey/:token', { token: token.substring(0, 10) + '...' });
    
    const result = await presenter.getSurveyByToken({ token });

    if (!result.isSuccess) {
      console.error('❌ Survey not found:', {
        token: token.substring(0, 10) + '...',
        errorName: result.error.name,
        errorMessage: result.error.message
      });
      
      if (result.error.name === 'SurveyNotFoundError') {
        return res.status(404).json({ error: result.error.message });
      }
      return res.status(400).json({ error: result.error.message });
    }

    console.log('✅ Survey loaded:', {
      token: token.substring(0, 10) + '...',
      surveyId: result.data.survey.id,
      questionsCount: result.data.survey.questions.length
    });

    return res.status(200).json(result.data);
  } catch (error) {
    console.error('❌ Survey route exception:', {
      token: req.params.token?.substring(0, 10) + '...',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /survey/:token/consent — record consent for invitation (before survey questions)
router.post('/:token/consent', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const { consentTextId, consentText } = req.body || {};
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = (req.headers['user-agent'] as string) ?? undefined;

    const result = await consentPresenter.recordConsent({
      invitationToken: token,
      consentTextId: consentTextId ?? null,
      consentText: consentText ?? null,
      ip: ip ?? null,
      userAgent: userAgent ?? null,
    });

    if (!result.isSuccess) {
      const err = result.error;
      if (err.name === 'ConsentAlreadyGivenError') {
        return res.status(409).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /survey/:token/start
router.post('/:token/start', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    // TODO: Add StartSurveyUseCase
    return res.status(501).json({ error: 'Start survey not implemented yet', token });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /survey/:token/complete
router.post('/:token/complete', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    // TODO: Add CompleteSurveyUseCase
    return res.status(501).json({ error: 'Complete survey not implemented yet', token });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /survey/:token/submit
router.post('/:token/submit', async (req: Request, res: Response) => {
  try {
    const token = req.params.token;
    const { questionId, value, audioUrl } = req.body;

    if (!questionId) {
      return res.status(400).json({ error: 'questionId is required' });
    }

    // TODO: Add SubmitSurveyResponseUseCase
    // This should create/update a response
    return res.status(501).json({ error: 'Submit response not implemented yet', token, questionId });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;



