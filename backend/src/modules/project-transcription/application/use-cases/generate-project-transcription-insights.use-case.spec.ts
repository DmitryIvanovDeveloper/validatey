import { beforeEach, describe, expect, it, vi } from 'vitest';
import ResultEx from '../../../../infrastructure/result/result';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { ProjectTranscriptionRepositoryPort } from '../ports/project-transcription-repository.port';
import type { TranscriptionInsightsLlmPort } from '../ports/transcription-insights-llm.port';
import { ProjectTranscriptionEntity } from '../../domain/entities/project-transcription.entity';
import { ProjectAccessDeniedError, ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import {
  NoTranscriptionsForInsightsError,
  TranscriptionInsightsGenerationError,
  TranscriptionInsightsPersistenceError,
  TranscriptionPersistenceError,
} from '../../domain/errors/transcription.error';
import { GenerateProjectTranscriptionInsightsUseCase } from './generate-project-transcription-insights.use-case';

const logger: LoggerPort = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

describe('GenerateProjectTranscriptionInsightsUseCase', () => {
  let projectRepository: ProjectRepositoryPort;
  let transcriptionRepository: ProjectTranscriptionRepositoryPort;
  let insightsLlm: TranscriptionInsightsLlmPort;
  let useCase: GenerateProjectTranscriptionInsightsUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    projectRepository = {
      findById: vi.fn().mockResolvedValue(ResultEx.success({ userId: 'u1' } as any)),
    } as unknown as ProjectRepositoryPort;

    transcriptionRepository = {
      listByProjectId: vi.fn().mockResolvedValue(
        ResultEx.success([
          new ProjectTranscriptionEntity(
            't1',
            'p1',
            'u1',
            'Transcript text',
            'f.wav',
            'audio/wav',
            1,
            'en',
            new Date('2026-03-19T00:00:00.000Z')
          ),
        ])
      ),
      saveInsights: vi.fn().mockImplementation(async (input) => ResultEx.success(input.payload)),
    } as unknown as ProjectTranscriptionRepositoryPort;

    insightsLlm = {
      generateInsights: vi.fn().mockResolvedValue(
        ResultEx.success({
          summary: 'Summary',
          insights: ['i1'],
          themes: ['t1'],
          risks: ['r1'],
          nextActions: ['a1'],
          generatedAt: new Date().toISOString(),
        })
      ),
    } as unknown as TranscriptionInsightsLlmPort;
    useCase = new GenerateProjectTranscriptionInsightsUseCase(
      logger,
      projectRepository,
      transcriptionRepository,
      insightsLlm
    );
  });

  it('returns insights when project access and history are valid', async () => {
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(true);
    if (!result.isSuccess) return;
    expect(result.data.summary).toBe('Summary');
    expect(transcriptionRepository.listByProjectId).toHaveBeenCalledWith('p1', 500, 0);
    expect(insightsLlm.generateInsights).toHaveBeenCalledTimes(1);
    expect(transcriptionRepository.saveInsights).toHaveBeenCalledTimes(1);
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

  it('fails when access denied', async () => {
    (projectRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.success({ userId: 'other' } as any)
    );
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(ProjectAccessDeniedError);
  });

  it('fails when no transcriptions found', async () => {
    (transcriptionRepository.listByProjectId as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.success([])
    );
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(NoTranscriptionsForInsightsError);
  });

  it('propagates repository failure', async () => {
    (transcriptionRepository.listByProjectId as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.failure(new TranscriptionPersistenceError('db failed'))
    );
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(TranscriptionPersistenceError);
  });

  it('propagates llm failure', async () => {
    (insightsLlm.generateInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.failure(new TranscriptionInsightsGenerationError('llm failed'))
    );
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(TranscriptionInsightsGenerationError);
  });

  it('propagates persistence failure', async () => {
    (transcriptionRepository.saveInsights as ReturnType<typeof vi.fn>).mockResolvedValue(
      ResultEx.failure(new TranscriptionInsightsPersistenceError('save failed'))
    );
    const result = await useCase.execute({ projectId: 'p1', userId: 'u1' });
    expect(result.isSuccess).toBe(false);
    if (result.isSuccess) return;
    expect(result.error).toBeInstanceOf(TranscriptionInsightsPersistenceError);
  });
});
