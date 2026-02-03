import { Router, Request, Response } from 'express';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { SurveyPresenter } from '../presenters/survey.presenter';

const router = Router();
const presenter = container.get<SurveyPresenter>(TYPES.SurveyPresenter);

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



