import { Router, Request, Response } from 'express';
import { container } from '../../../infrastructure/bootstrap/container';
import { TYPES } from '../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../infrastructure/http/ports/http-client.port';

/** Proxy: POST { prompt } → { response }. Single endpoint, no API key. */
const AI_PROXY_URL = 'https://cerebras-api.vercel.app/api/prompt';

const router = Router();

function buildSegmentUserContent(segmentDescription: string, segmentDemographics: string): string {
  if (!segmentDescription.trim() && !segmentDemographics.trim()) {
    return '';
  }
  return `Target segment:\n${segmentDescription ? `Description: ${segmentDescription}\n` : ''}${segmentDemographics ? `Demographics: ${segmentDemographics}` : ''}`.trim();
}

const SYSTEM_PROMPT = `You are a product manager assistant. Given a target audience/segment, suggest ONE product hypothesis and 3-5 testable assumptions.

Respond with ONLY a valid JSON object in this exact format (no markdown, no extra text):
{"description":"We believe that [target users] [need/want] [something] because [reason].","assumptions":["Assumption 1","Assumption 2","Assumption 3"]}

- description: one clear sentence (hypothesis statement).
- assumptions: array of 3-5 short, testable assumptions.

Keep the description under 300 characters and each assumption under 120 characters.`;

function parseContentToSuggestion(content: string): { description: string; assumptions: string[] } {
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { description: '', assumptions: [] };
  }
  const parsed = JSON.parse(jsonMatch[0]) as { description?: string; assumptions?: string[] };
  const description = typeof parsed.description === 'string' ? parsed.description : '';
  const assumptions = Array.isArray(parsed.assumptions)
    ? parsed.assumptions.filter((a) => typeof a === 'string').slice(0, 10)
    : [];
  return {
    description: (description || '').trim(),
    assumptions,
  };
}

/** POST /api/ai/hypothesis-suggest — AI suggestion for hypothesis + assumptions from segment. */
router.post('/hypothesis-suggest', async (req: Request, res: Response) => {
  try {
    const segmentDescription = (req.body?.segmentDescription ?? '').trim();
    const segmentDemographics = (req.body?.segmentDemographics ?? '').trim();
    const userContent = buildSegmentUserContent(segmentDescription, segmentDemographics);
    if (!userContent) {
      return res.status(400).json({
        error: 'Provide segment description or demographics for a relevant hypothesis suggestion.',
      });
    }
    const httpClient = container.get<HttpClientPort>(TYPES.HttpClient);

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nUser input:\n${userContent}`;
    const proxyResponse = await httpClient.post<{ response?: string }>(
      AI_PROXY_URL,
      { prompt: fullPrompt },
      {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      }
    );
    const content = (proxyResponse?.response ?? '').trim();

    if (!content) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    const suggestion = parseContentToSuggestion(content);
    return res.status(200).json(suggestion);
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Unknown error';
    const isBlocked =
      raw.includes('403') ||
      raw.includes('Cloudflare') ||
      raw.includes('<!DOCTYPE') ||
      raw.length > 500;
    const errorMessage = isBlocked
      ? 'AI proxy is unavailable (blocked or 403). Use direct Cerebras API with API key.'
      : raw;
    const hint = isBlocked
      ? 'AI proxy may block server requests. Try again later or check cerebras-api.vercel.app.'
      : 'AI helper uses cerebras-api.vercel.app proxy.';
    return res.status(502).json({ error: errorMessage, hint });
  }
});

export default router;
