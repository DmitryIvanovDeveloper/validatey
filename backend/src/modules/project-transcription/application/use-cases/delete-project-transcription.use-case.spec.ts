import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteProjectTranscriptionUseCase } from './delete-project-transcription.use-case';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { ProjectTranscriptionRepositoryPort } from '../ports/project-transcription-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectAccessDeniedError, ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import { ProjectTranscriptionNotFoundError } from '../../domain/errors/transcription.error';

const logger: LoggerPort = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('DeleteProjectTranscriptionUseCase', () => {
  let projectRepository: ProjectRepositoryPort;
  let transcriptionRepository: ProjectTranscriptionRepositoryPort;
  let useCase: DeleteProjectTranscriptionUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ResultEx.success({ userId: 'u1' } as any)),
    } as unknown as ProjectRepositoryPort;
    transcriptionRepository = {
      deleteById: vi.fn().mockResolvedValue(ResultEx.success(undefined)),
    } as unknown as ProjectTranscriptionRepositoryPort;

    useCase = new DeleteProjectTranscriptionUseCase(logger, projectRepository, transcriptionRepository);
  });

  it('deletes when user owns project', async () => {
    const result = await useCase.execute({
      projectId: 'p1',
      userId: 'u1',
      transcriptionId: 't1',
    });
    expect(result.isSuccess).toBe(true);
    expect(transcriptionRepository.deleteById).toHaveBeenCalledWith({
      id: 't1',
      projectId: 'p1',
      userId: 'u1',
    });
  });

  it('fails when access denied', async () => {
    (projectRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.success({ userId: 'other' } as any)
    );
    const result = await useCase.execute({
      projectId: 'p1',
      userId: 'u1',
      transcriptionId: 't1',
    });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ProjectAccessDeniedError);
  });

  it('fails when project not found', async () => {
    (projectRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.failure(new ProjectNotFoundError('p1'))
    );
    const result = await useCase.execute({
      projectId: 'p1',
      userId: 'u1',
      transcriptionId: 't1',
    });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ProjectNotFoundError);
  });

  it('propagates transcription not found', async () => {
    (transcriptionRepository.deleteById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.failure(new ProjectTranscriptionNotFoundError('t1'))
    );
    const result = await useCase.execute({
      projectId: 'p1',
      userId: 'u1',
      transcriptionId: 't1',
    });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ProjectTranscriptionNotFoundError);
  });
});
