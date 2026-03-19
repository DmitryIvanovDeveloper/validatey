import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import ResultEx from '../../../../infrastructure/result/result';
import type {
  GenerateTranscriptionInsightsInput,
  TranscriptionInsightsLlmPort,
  TranscriptionInsightsOutput,
} from '../../application/ports/transcription-insights-llm.port';
import { TranscriptionInsightsGenerationError } from '../../domain/errors/transcription.error';

const AI_PROXY_URL = process.env.TRANSCRIPTION_INSIGHTS_LLM_URL || 'https://cerebras-api.vercel.app/api/prompt';

const SYSTEM_PROMPT = `You analyze interview transcripts and produce concise product insights.

Return ONLY valid JSON with this exact shape:
{
  "summary": "string",
  "insights": ["string"],
  "themes": ["string"],
  "risks": ["string"],
  "nextActions": ["string"]
}

Rules:
- Keep summary 3-5 sentences, concrete and evidence-based.
- insights: 4-8 bullets, each one sentence.
- themes: 3-6 short theme labels.
- risks: 2-5 concrete risks.
- nextActions: 3-6 actionable steps.
- Do not include markdown.
- Do not include extra keys.
- If data is noisy, still infer best effort insights from available transcripts.`;

@injectable()
export class TranscriptionInsightsLlmAdapter implements TranscriptionInsightsLlmPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _http: HttpClientPort
  ) {}

  async generateInsights(
    input: GenerateTranscriptionInsightsInput
  ): Promise<ResultEx<TranscriptionInsightsOutput, TranscriptionInsightsGenerationError>> {
    try {
      const numbered = input.history
        .map((item, idx) => {
          const transcript =
            item.transcript.length > 2500 ? `${item.transcript.slice(0, 2500)} ...[truncated]` : item.transcript;
          return [
            `#${idx + 1}`,
            `id: ${item.id}`,
            `file: ${item.originalFilename || 'unknown'}`,
            `createdAt: ${item.createdAtIso}`,
            `language: ${item.language || 'unknown'}`,
            `transcript: ${transcript}`,
          ].join('\n');
        })
        .join('\n\n');

      const prompt = `${SYSTEM_PROMPT}\n\nProject: ${input.projectId}\n\nTranscripts:\n${numbered}`;

      const response = await this._http.post<{ response?: string }>(
        AI_PROXY_URL,
        {
          prompt,
          model: 'llama3.3-70b',
          max_tokens: 3072,
        },
        { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)' }
      );

      const content = (response?.response ?? '').trim();
      if (!content) {
        return ResultEx.failure(new TranscriptionInsightsGenerationError('Empty response from LLM'));
      }

      const parsed = this.parseJson(content);
      return ResultEx.success({
        ...parsed,
        generatedAt: new Date().toISOString(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return ResultEx.failure(new TranscriptionInsightsGenerationError(`Insights generation failed: ${msg}`));
    }
  }

  private parseJson(content: string): Omit<TranscriptionInsightsOutput, 'generatedAt'> {
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new TranscriptionInsightsGenerationError('LLM response contained no JSON object');
    }

    let raw = match[0];
    let obj: Record<string, unknown>;
    try {
      obj = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      raw = raw.replace(/,\s*(\]|\})/g, '$1');
      obj = JSON.parse(raw) as Record<string, unknown>;
    }

    const summary = typeof obj.summary === 'string' ? obj.summary.trim() : '';
    const insights = Array.isArray(obj.insights)
      ? obj.insights.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean)
      : [];
    const themes = Array.isArray(obj.themes)
      ? obj.themes.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean)
      : [];
    const risks = Array.isArray(obj.risks)
      ? obj.risks.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean)
      : [];
    const nextActions = Array.isArray(obj.nextActions)
      ? obj.nextActions.filter((v): v is string => typeof v === 'string').map((v) => v.trim()).filter(Boolean)
      : [];

    if (!summary) {
      throw new TranscriptionInsightsGenerationError('LLM JSON does not contain a valid summary');
    }

    return { summary, insights, themes, risks, nextActions };
  }
}
