import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { SpeechToTextPort, TranscribeFromBufferInput, TranscribeFromBufferOutput } from '../../application/ports/speech-to-text.port';
import { SpeechToTextProviderError } from '../../domain/errors/transcription.error';

const WHISPER_URL = 'https://api.openai.com/v1/audio/transcriptions';

@injectable()
export class OpenAIWhisperAdapter implements SpeechToTextPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async transcribeFromBuffer(
    input: TranscribeFromBufferInput
  ): Promise<ResultEx<TranscribeFromBufferOutput, SpeechToTextProviderError>> {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return ResultEx.failure(new SpeechToTextProviderError('OPENAI_API_KEY is not configured'));
    }

    const model = process.env.OPENAI_WHISPER_MODEL?.trim() || 'whisper-1';

    try {
      const form = new FormData();
      const blob = new Blob([new Uint8Array(input.buffer)], { type: input.mimeType || 'application/octet-stream' });
      form.append('file', blob, input.filename || 'audio');
      form.append('model', model);
      if (input.language?.trim()) {
        form.append('language', input.language.trim());
      }

      const response = await fetch(WHISPER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: form,
      });

      const rawText = await response.text();
      if (!response.ok) {
        this._logger.error('openai-whisper.error', { status: response.status, body: rawText.slice(0, 500) });
        let message = `OpenAI transcription failed (${response.status})`;
        try {
          const j = JSON.parse(rawText) as { error?: { message?: string } };
          if (j?.error?.message) message = j.error.message;
        } catch {
          /* ignore */
        }
        return ResultEx.failure(new SpeechToTextProviderError(message));
      }

      const json = JSON.parse(rawText) as { text?: string };
      const text = typeof json.text === 'string' ? json.text : '';
      return ResultEx.success({ text });
    } catch (e) {
      this._logger.error('openai-whisper.exception', { error: e });
      return ResultEx.failure(
        new SpeechToTextProviderError(e instanceof Error ? e.message : 'Unknown transcription error')
      );
    }
  }
}
