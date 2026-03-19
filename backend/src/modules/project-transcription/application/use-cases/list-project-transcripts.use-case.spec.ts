import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ListProjectTranscriptsUseCase } from './list-project-transcripts.use-case';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { ProjectTranscriptionRepositoryPort } from '../ports/project-transcription-repository.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectAccessDeniedError, ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import { ProjectTranscriptionEntity } from '../../domain/entities/project-transcription.entity';

const logger: LoggerPort = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('ListProjectTranscriptsUseCase', () => {
  let projectRepository: ProjectRepositoryPort;
  let transcriptionRepository: ProjectTranscriptionRepositoryPort;
  let useCase: ListProjectTranscriptsUseCase;

  const row = new ProjectTranscriptionEntity(
    't1',
    'p1',
    'u1',
    'text',
    null,
    null,
    null,
    null,
    new Date('2025-01-02T00:00:00.000Z')
  );

  beforeEach(() => {
    vi.clearAllMocks();
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ResultEx.success({ userId: 'u1' } as any)),
    } as unknown as ProjectRepositoryPort;
    transcriptionRepository = {
      create: vi.fn(),
      listByProjectId: vi.fn().mockResolvedValue(ResultEx.success([row])),
      deleteById: vi.fn(),
    } as unknown as ProjectTranscriptionRepositoryPort;

    useCase = new ListProjectTranscriptsUseCase(logger, projectRepository, transcriptionRepository);
  });

  it('returns list when user has access', async () => {
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe('t1');
    expect(transcriptionRepository.listByProjectId).toHaveBeenCalledWith('p1', 50, 0);
  });

  it('fails when access denied', async () => {
    (projectRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.success({ userId: 'other' } as any)
    );
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ProjectAccessDeniedError);
  });

  it('fails when project not found', async () => {
    (projectRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.failure(new ProjectNotFoundError('p1'))
    );
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ProjectNotFoundError);
  });
});
