import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { ProjectAccessDeniedError, ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { SpeechToTextPort } from '../ports/speech-to-text.port';
import type { ProjectTranscriptionRepositoryPort } from '../ports/project-transcription-repository.port';
import {
  InvalidAudioFileError,
  AudioFileTooLargeError,
  SpeechToTextProviderError,
  TranscriptionPersistenceError,
} from '../../domain/errors/transcription.error';

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const ALLOWED_MIME_PREFIXES = ['audio/'];

const DISALLOWED_ONLY = new Set(['application/octet-stream']);

function isAllowedAudioMime(mime: string): boolean {
  const m = (mime || '').trim().toLowerCase();
  if (!m || DISALLOWED_ONLY.has(m)) return false;
  return ALLOWED_MIME_PREFIXES.some((p) => m.startsWith(p));
}

export interface TranscribeProjectAudioRequest {
  projectId: string;
  userId: string;
  buffer: Buffer;
  mimeType: string;
  originalFilename: string;
  language?: string;
}

export interface TranscribeProjectAudioResponse {
  id: string;
  transcript: string;
  createdAt: string;
  language?: string;
  originalFilename?: string;
}

@injectable()
export class TranscribeProjectAudioUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(TYPES.SpeechToTextPort)
    private readonly _speechToText: SpeechToTextPort,
    @inject(TYPES.ProjectTranscriptionRepository)
    private readonly _transcriptionRepository: ProjectTranscriptionRepositoryPort
  ) {}

  async execute(
    request: TranscribeProjectAudioRequest
  ): Promise<
    ResultEx<
      TranscribeProjectAudioResponse,
      | ProjectNotFoundError
      | ProjectAccessDeniedError
      | InvalidAudioFileError
      | AudioFileTooLargeError
      | SpeechToTextProviderError
      | TranscriptionPersistenceError
    >
  > {
    const { projectId, userId, buffer, mimeType, originalFilename, language } = request;

    if (!buffer?.length) {
      return ResultEx.failure(new InvalidAudioFileError('Audio file is empty'));
    }
    if (buffer.length > MAX_AUDIO_BYTES) {
      return ResultEx.failure(new AudioFileTooLargeError(MAX_AUDIO_BYTES));
    }
    if (!isAllowedAudioMime(mimeType)) {
      return ResultEx.failure(new InvalidAudioFileError(`Unsupported audio type: ${mimeType}`));
    }

    const projectResult = await this._projectRepository.findById(projectId);
    if (!projectResult.isSuccess) {
      return ResultEx.failure(projectResult.error);
    }
    const project = projectResult.data;
    if (project.userId !== userId) {
      this._logger.warn('transcribe-project-audio.access-denied', { projectId, userId });
      return ResultEx.failure(new ProjectAccessDeniedError(projectId, userId));
    }

    const sttResult = await this._speechToText.transcribeFromBuffer({
      buffer,
      mimeType,
      filename: originalFilename || 'audio',
      language,
    });
    if (!sttResult.isSuccess) {
      return ResultEx.failure(sttResult.error);
    }

    const text = sttResult.data.text.trim();
    if (!text) {
      return ResultEx.failure(new SpeechToTextProviderError('Transcription returned empty text'));
    }

    const saveResult = await this._transcriptionRepository.create({
      projectId,
      userId,
      transcript: text,
      originalFilename: originalFilename,
      mimeType,
      sizeBytes: buffer.length,
      language: sttResult.data.language ?? language,
    });
    if (!saveResult.isSuccess) {
      return ResultEx.failure(saveResult.error);
    }

    const row = saveResult.data;
    return ResultEx.success({
      id: row.id,
      transcript: row.transcript,
      createdAt: row.createdAt.toISOString(),
      language: row.language ?? undefined,
      originalFilename: row.originalFilename ?? undefined,
    });
  }
}
