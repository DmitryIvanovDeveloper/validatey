import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TranscribeProjectAudioUseCase } from './transcribe-project-audio.use-case';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { SpeechToTextPort } from '../ports/speech-to-text.port';
import type { ProjectTranscriptionRepositoryPort } from '../ports/project-transcription-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectAccessDeniedError, ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import { ProjectTranscriptionEntity } from '../../domain/entities/project-transcription.entity';
import { DuplicateTranscriptionFileError } from '../../domain/errors/transcription.error';

const logger: LoggerPort = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('TranscribeProjectAudioUseCase', () => {
  let projectRepository: ProjectRepositoryPort;
  let speechToText: SpeechToTextPort;
  let transcriptionRepository: ProjectTranscriptionRepositoryPort;
  let useCase: TranscribeProjectAudioUseCase;

  const projectOk = {
    userId: 'user-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ResultEx.success(projectOk as any)),
    } as unknown as ProjectRepositoryPort;
    speechToText = {
      transcribeFromBuffer: vi
        .fn()
        .mockResolvedValue(ResultEx.success({ text: '  hello world  ', language: 'en' })),
    } as unknown as SpeechToTextPort;
    transcriptionRepository = {
      existsByProjectAndFile: vi.fn().mockResolvedValue(ResultEx.success(false)),
      create: vi.fn().mockResolvedValue(
        ResultEx.success(
          new ProjectTranscriptionEntity(
            'tid-1',
            'pid-1',
            'user-1',
            'hello world',
            'a.webm',
            'audio/webm',
            100,
            'en',
            new Date('2025-01-01T00:00:00.000Z')
          )
        )
      ),
      listByProjectId: vi.fn(),
      deleteById: vi.fn(),
    } as unknown as ProjectTranscriptionRepositoryPort;

    useCase = new TranscribeProjectAudioUseCase(
      logger,
      projectRepository,
      speechToText,
      transcriptionRepository
    );
  });

  it('returns transcript and calls create after successful Whisper', async () => {
    const buf = Buffer.from('fake');
    const result = await useCase.execute({
      projectId: 'pid-1',
      userId: 'user-1',
      buffer: buf,
      mimeType: 'audio/webm',
      originalFilename: 'a.webm',
    });

    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    expect(result.data.transcript).toBe('hello world');
    expect(result.data.id).toBe('tid-1');
    expect(result.data.originalFilename).toBe('a.webm');
    expect(speechToText.transcribeFromBuffer).toHaveBeenCalledWith(
      expect.objectContaining({
        buffer: buf,
        mimeType: 'audio/webm',
        filename: 'a.webm',
      })
    );
    expect(transcriptionRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'pid-1',
        userId: 'user-1',
        transcript: 'hello world',
      })
    );
  });

  it('fails when the same audio file already exists in history', async () => {
    (transcriptionRepository.existsByProjectAndFile as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.success(true)
    );

    const result = await useCase.execute({
      projectId: 'pid-1',
      userId: 'user-1',
      buffer: Buffer.from('fake'),
      mimeType: 'audio/webm',
      originalFilename: 'a.webm',
    });

    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(DuplicateTranscriptionFileError);
    expect(speechToText.transcribeFromBuffer).not.toHaveBeenCalled();
    expect(transcriptionRepository.create).not.toHaveBeenCalled();
  });

  it('fails with ProjectAccessDeniedError when userId does not match', async () => {
    (projectRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.success({ userId: 'other' } as any)
    );

    const result = await useCase.execute({
      projectId: 'pid-1',
      userId: 'user-1',
      buffer: Buffer.from('x'),
      mimeType: 'audio/webm',
      originalFilename: 'a.webm',
    });

    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ProjectAccessDeniedError);
  });

  it('fails with ProjectNotFoundError when project missing', async () => {
    (projectRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.failure(new ProjectNotFoundError('pid-1'))
    );

    const result = await useCase.execute({
      projectId: 'pid-1',
      userId: 'user-1',
      buffer: Buffer.from('x'),
      mimeType: 'audio/webm',
      originalFilename: 'a.webm',
    });

    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ProjectNotFoundError);
  });
});
