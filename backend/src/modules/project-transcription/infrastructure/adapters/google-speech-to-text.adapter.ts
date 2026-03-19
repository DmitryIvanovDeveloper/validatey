import fs from 'fs';
import path from 'path';
import { injectable, inject } from 'inversify';
import { SpeechClient, protos } from '@google-cloud/speech';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { SpeechToTextPort, TranscribeFromBufferInput, TranscribeFromBufferOutput } from '../../application/ports/speech-to-text.port';
import { SpeechToTextProviderError } from '../../domain/errors/transcription.error';

type AudioEncoding = protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;
type IRecognitionConfig = protos.google.cloud.speech.v1.IRecognitionConfig;

function parseWavHeader(
  buffer: Buffer
): { sampleRateHertz: number; audioChannelCount: number } | null {
  // Minimal RIFF/WAVE parser to extract sample rate & channel count.
  // Works for common PCM WAVs; if it can't parse, we fall back to env defaults.
  if (buffer.length < 12) return null;
  if (buffer.toString('ascii', 0, 4) !== 'RIFF') return null;
  if (buffer.toString('ascii', 8, 12) !== 'WAVE') return null;

  let sampleRateHertz: number | undefined;
  let audioChannelCount: number | undefined;

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkDataOffset = offset + 8;

    if (chunkId === 'fmt ') {
      // For PCM WAV: wFormatTag(2), nChannels(2), nSamplesPerSec(4), ...
      // fmt chunk data needs at least 14 bytes from chunkDataOffset.
      if (chunkDataOffset + 14 <= buffer.length) {
        const audioFormat = buffer.readUInt16LE(chunkDataOffset);
        // 1 = PCM. Even if not PCM, we can still read SR/channels, but recognition may fail later.
        const channels = buffer.readUInt16LE(chunkDataOffset + 2);
        const sampleRate = buffer.readUInt32LE(chunkDataOffset + 4);

        // Avoid returning obviously broken values.
        if (typeof audioFormat === 'number' && audioFormat > 0) {
          audioChannelCount = channels;
          sampleRateHertz = sampleRate;
        }
      }
    }

    if (sampleRateHertz && audioChannelCount) break;

    // RIFF chunks are word-aligned.
    offset = chunkDataOffset + chunkSize;
    if (chunkSize % 2 === 1) offset += 1;
  }

  if (!sampleRateHertz || !audioChannelCount) return null;
  return { sampleRateHertz, audioChannelCount };
}

function buildEncodingConfig(
  mimeType: string,
  filename: string,
  buffer?: Buffer
): Pick<IRecognitionConfig, 'encoding' | 'sampleRateHertz' | 'audioChannelCount'> {
  const m = (mimeType || '').toLowerCase();
  const name = (filename || '').toLowerCase();

  if (m.includes('mpeg') || m.includes('mp3') || name.endsWith('.mp3')) {
    return { encoding: 'MP3' as unknown as AudioEncoding };
  }
  if (m.includes('webm')) {
    return { encoding: 'WEBM_OPUS' as unknown as AudioEncoding };
  }
  if (m.includes('ogg')) {
    return { encoding: 'OGG_OPUS' as unknown as AudioEncoding };
  }
  if (m.includes('flac') || name.endsWith('.flac')) {
    return { encoding: 'FLAC' as unknown as AudioEncoding };
  }

  let hz = parseInt(process.env.GOOGLE_SPEECH_SAMPLE_RATE_HERTZ || '16000', 10);
  let channels = parseInt(process.env.GOOGLE_SPEECH_CHANNELS || '1', 10);

  const looksLikeWav = m.includes('wav') || name.endsWith('.wav');
  if (looksLikeWav && buffer?.length) {
    const header = parseWavHeader(buffer);
    if (header) {
      hz = header.sampleRateHertz;
      channels = header.audioChannelCount;
    }
  }

  return {
    encoding: 'LINEAR16' as unknown as AudioEncoding,
    sampleRateHertz: hz,
    audioChannelCount: channels,
  };
}

/** OAuth "web" / desktop JSON is not valid for @google-cloud/speech — needs Service Account key. */
function assertIsServiceAccountJson(parsed: unknown): void {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Google credentials JSON must be an object');
  }
  const o = parsed as Record<string, unknown>;
  if (o.web && typeof o.web === 'object') {
    throw new Error(
      'Credentials look like OAuth "web" client JSON (Supabase/Google Sign-In). Cloud Speech-to-Text needs a Service Account key: GCP Console → IAM → Service accounts → select account → Keys → Add key → JSON. Replace the file referenced by GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }
  if (typeof o.client_email !== 'string' || !o.client_email.trim()) {
    throw new Error(
      'Service Account JSON must include "client_email". Download a Service Account key (not OAuth client secret) from GCP.'
    );
  }
  if (typeof o.private_key !== 'string' || !o.private_key.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Service Account JSON must include a PEM "private_key" field.');
  }
  if (o.type !== undefined && o.type !== 'service_account') {
    throw new Error(`Expected Service Account JSON (type "service_account"), got "${String(o.type)}".`);
  }
}

/** Validates whichever credential source createSpeechClient() will use (JSON env wins over file path). */
function ensureGoogleSpeechCredentialsAreServiceAccount(): void {
  const rawJson = process.env.GOOGLE_SPEECH_CREDENTIALS_JSON?.trim();
  const filePath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();

  let parsed: unknown;
  if (rawJson) {
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new Error('GOOGLE_SPEECH_CREDENTIALS_JSON is not valid JSON');
    }
  } else if (filePath) {
    const resolved = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
    let raw: string;
    try {
      raw = fs.readFileSync(resolved, 'utf8');
    } catch {
      throw new Error(`Cannot read GOOGLE_APPLICATION_CREDENTIALS file: ${resolved}`);
    }
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Invalid JSON in GOOGLE_APPLICATION_CREDENTIALS file: ${resolved}`);
    }
  } else {
    return;
  }

  assertIsServiceAccountJson(parsed);
}

function createSpeechClient(): SpeechClient {
  const rawJson = process.env.GOOGLE_SPEECH_CREDENTIALS_JSON?.trim();
  if (rawJson) {
    let credentials: Record<string, unknown>;
    try {
      credentials = JSON.parse(rawJson) as Record<string, unknown>;
    } catch {
      throw new Error('GOOGLE_SPEECH_CREDENTIALS_JSON is not valid JSON');
    }
    return new SpeechClient({ credentials });
  }
  return new SpeechClient();
}

@injectable()
export class GoogleSpeechToTextAdapter implements SpeechToTextPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async transcribeFromBuffer(
    input: TranscribeFromBufferInput
  ): Promise<ResultEx<TranscribeFromBufferOutput, SpeechToTextProviderError>> {
    const hasFileCreds = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim());
    const hasJsonCreds = Boolean(process.env.GOOGLE_SPEECH_CREDENTIALS_JSON?.trim());
    if (!hasFileCreds && !hasJsonCreds) {
      return ResultEx.failure(
        new SpeechToTextProviderError(
          'Google Speech-to-Text: set GOOGLE_APPLICATION_CREDENTIALS (path to service account JSON) or GOOGLE_SPEECH_CREDENTIALS_JSON'
        )
      );
    }

    try {
      ensureGoogleSpeechCredentialsAreServiceAccount();
      const client = createSpeechClient();
      const encodingPart = buildEncodingConfig(input.mimeType, input.filename, input.buffer);
      const languageCode =
        input.language?.trim() || process.env.GOOGLE_SPEECH_LANGUAGE_CODE?.trim() || 'en-US';
      const model = process.env.GOOGLE_SPEECH_MODEL?.trim() || 'latest_long';

      const config: IRecognitionConfig = {
        ...encodingPart,
        languageCode,
        enableAutomaticPunctuation: true,
        model,
      };

      const audio = {
        content: input.buffer.toString('base64'),
      };

      this._logger.info('google-speech.transcribe.start', {
        mimeType: input.mimeType,
        filename: input.filename,
        bytes: input.buffer.length,
        languageCode,
        model,
      });

      const [operation] = await client.longRunningRecognize({ config, audio });
      const [response] = await operation.promise();

      const text = (response.results ?? [])
        .map((r) => r.alternatives?.[0]?.transcript ?? '')
        .join(' ')
        .trim();

      if (!text) {
        return ResultEx.failure(new SpeechToTextProviderError('Google Speech-to-Text returned empty transcript'));
      }

      return ResultEx.success({ text });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this._logger.error('google-speech.transcribe.error', { message });
      return ResultEx.failure(new SpeechToTextProviderError(`Google Speech-to-Text: ${message}`));
    }
  }
}
