/**
 * Unit tests for getPatternComments: controller calls GetPatternCommentsUseCase
 * and maps result to API response (comments + pattern).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { CommentController } from '../comment.controller';
import { COMMENT_TYPES } from '../../../types';
import type { CommentRepositoryPort } from '../../../application/ports/comment-repository.port';
import type { CommentSourceRepositoryPort } from '../../../application/ports/comment-source-repository.port';
import type { ProjectRepositoryPort } from '../../../../projects/application/ports/project-repository.port';
import type { IGetPatternCommentsUseCase } from '../../../application/use-cases/get-pattern-comments.use-case';
import type { ResearchDataRepositoryPort } from '../../../../research/application/ports/research-data-repository.port';
import ResultEx from '../../../../../infrastructure/result/result';
import { CommentEntity } from '../../../domain/entities/comment.entity';

const PROJECT_ID = 'a1b2c3d4-e5f6-4780-a123-456789abcdef';
const COMMENT_ID_1 = 'b2c3d4e5-f6a7-4891-b234-567890abcdef';
const COMMENT_ID_2 = 'c3d4e5f6-a7b8-4902-c345-678901abcdef';

function createCommentEntity(id: string, content: string, author: string): CommentEntity {
  return CommentEntity.create({
    id,
    sourceId: 'src-1',
    projectId: PROJECT_ID,
    externalId: `ext-${id.slice(0, 8)}`,
    content,
    author,
    url: 'https://example.com/1',
    contextTitle: 'Post 1',
    contextUrl: 'https://example.com/post1',
    createdAt: new Date('2025-01-01T12:00:00Z'),
    fetchedAt: new Date('2025-01-01T12:00:00Z'),
    isProcessed: true,
    processedAt: null,
    importOrigin: 'api_fetch',
    subsourceName: null,
  });
}

function createMockRequest(overrides: Partial<{ params: Record<string, string>; query: Record<string, string> }> = {}): Request {
  return {
    params: { projectId: PROJECT_ID, patternType: 'validation' },
    query: {},
    ...overrides,
  } as Request;
}

function createMockResponse(): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  } as unknown as Response;
}

function createController(
  getPatternCommentsUseCase: IGetPatternCommentsUseCase,
  commentRepository?: Partial<CommentRepositoryPort>,
  getSuggestedOutreachCommentersUseCase?: IGetSuggestedOutreachCommentersUseCase
): CommentController {
  const noop = vi.fn();
  const startFetch = { execute: noop };
  const deleteSource = { execute: noop };
  const getComments = { execute: noop };
  const getCommentById = { execute: noop };
  const getFetchStatus = { execute: noop };
  const sourceRepo: CommentSourceRepositoryPort = {
    findByProjectId: vi.fn().mockResolvedValue(ResultEx.success([])),
    create: noop,
    delete: noop,
    findById: noop as any,
    update: noop as any,
  } as any;
  const projectRepo: ProjectRepositoryPort = {
    findById: vi.fn().mockResolvedValue(ResultEx.success({ id: PROJECT_ID, name: 'Test' } as any)),
    findByPublicSlug: vi.fn().mockResolvedValue(ResultEx.success({ id: PROJECT_ID, name: 'Test' } as any)),
  } as any;
  const researchDataRepo: ResearchDataRepositoryPort = {
    findByProjectId: noop,
    save: noop,
    updateResearchStatus: noop,
  } as any;
  const commentRepo: CommentRepositoryPort = {
    getCommentSourcesByProjectId: vi.fn().mockResolvedValue(ResultEx.success([])),
    ...commentRepository,
  } as any;
  const fetchCommentsUseCase = { execute: noop } as any;
  const suggestedOutreachUseCase = getSuggestedOutreachCommentersUseCase ?? ({ execute: noop } as any);
  const getCommentsByAuthorUseCase = { execute: noop } as any;
  const getCommentsActivityUseCase = { execute: noop } as any;
  const getCommentsFreshnessUseCase = { execute: noop } as any;

  return new CommentController(
    startFetch as any,
    deleteSource as any,
    getComments as any,
    getCommentById as any,
    getFetchStatus as any,
    sourceRepo,
    commentRepo,
    fetchCommentsUseCase,
    getPatternCommentsUseCase,
    suggestedOutreachUseCase,
    getCommentsByAuthorUseCase,
    getCommentsActivityUseCase,
    getCommentsFreshnessUseCase,
    projectRepo,
    researchDataRepo
  );
}

describe('CommentController.getPatternComments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns full comments when use case returns success with comments', async () => {
    const comment1 = createCommentEntity(COMMENT_ID_1, 'First comment text for pattern.', 'user1');
    const comment2 = createCommentEntity(COMMENT_ID_2, 'Second comment supporting the pattern.', 'user2');
    const getPatternCommentsUseCase: IGetPatternCommentsUseCase = {
      execute: vi.fn().mockResolvedValue(
        ResultEx.success({
          comments: [comment1, comment2],
          pattern: { type: 'validation', label: 'Users want structured feedback', count: 2, percentage: 50 },
        })
      ),
    };

    const controller = createController(getPatternCommentsUseCase);
    const req = createMockRequest();
    const res = createMockResponse();

    await controller.getPatternComments(req, res);

    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledTimes(1);
    const payload = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(payload).toHaveProperty('comments');
    expect(payload).toHaveProperty('total');
    expect(payload).toHaveProperty('pattern');
    expect(payload.total).toBe(2);
    expect(Array.isArray(payload.comments)).toBe(true);
    expect(payload.comments).toHaveLength(2);
    expect(payload.comments[0]).toMatchObject({
      id: COMMENT_ID_1,
      content: 'First comment text for pattern.',
      author: 'user1',
      projectId: PROJECT_ID,
    });
    expect(payload.comments[1]).toMatchObject({
      id: COMMENT_ID_2,
      content: 'Second comment supporting the pattern.',
      author: 'user2',
    });
    expect(payload.pattern).toMatchObject({
      type: 'validation',
      label: 'Users want structured feedback',
      count: 2,
      percentage: 50,
    });
  });

  it('returns 404 when use case returns failure with "not available" message', async () => {
    const getPatternCommentsUseCase: IGetPatternCommentsUseCase = {
      execute: vi.fn().mockResolvedValue(
        ResultEx.failure(new Error('Pattern analysis not available. Please run "Start Research" first.'))
      ),
    };

    const controller = createController(getPatternCommentsUseCase);
    const req = createMockRequest();
    const res = createMockResponse();

    await controller.getPatternComments(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Pattern analysis not available') })
    );
  });

  it('returns comments array and total 0 when use case returns success with empty comments', async () => {
    const getPatternCommentsUseCase: IGetPatternCommentsUseCase = {
      execute: vi.fn().mockResolvedValue(
        ResultEx.success({
          comments: [],
          pattern: { type: 'validation', label: 'Empty pattern', count: 0, percentage: 0 },
        })
      ),
    };

    const controller = createController(getPatternCommentsUseCase);
    const req = createMockRequest();
    const res = createMockResponse();

    await controller.getPatternComments(req, res);

    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        comments: [],
        total: 0,
        pattern: expect.objectContaining({ type: 'validation', label: 'Empty pattern' }),
      })
    );
  });

  it('uses patternIndex and commentIdsFromQuery when provided in query', async () => {
    const comment2 = createCommentEntity(COMMENT_ID_2, 'Second comment.', 'user2');
    const getPatternCommentsUseCase: IGetPatternCommentsUseCase = {
      execute: vi.fn().mockResolvedValue(
        ResultEx.success({
          comments: [comment2],
          pattern: { type: 'failure', label: 'Second', count: 2, percentage: 10 },
        })
      ),
    };

    const controller = createController(getPatternCommentsUseCase);
    const req = createMockRequest({ query: { patternIndex: '1' } });
    const res = createMockResponse();

    await controller.getPatternComments(req, res);

    expect(getPatternCommentsUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: PROJECT_ID,
        patternType: 'validation',
        patternIndex: 1,
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        total: 1,
        pattern: expect.objectContaining({ type: 'failure', label: 'Second' }),
      })
    );
  });
});

describe('CommentController.getSuggestedOutreach', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns commenters when use case returns success', async () => {
    const getPatternCommentsUseCase: IGetPatternCommentsUseCase = { execute: vi.fn() };
    const getSuggestedOutreachCommentersUseCase: IGetSuggestedOutreachCommentersUseCase = {
      execute: vi.fn().mockResolvedValue(
        ResultEx.success({
          commenters: [
            {
              author: 'alice',
              sourceType: 'reddit',
              commentCount: 5,
              supportingCount: 3,
              lastCommentAt: '2025-01-15T10:00:00Z',
              profileUrl: 'https://www.reddit.com/user/alice',
            },
          ],
        })
      ),
    };

    const controller = createController(getPatternCommentsUseCase, undefined, getSuggestedOutreachCommentersUseCase);
    const req = createMockRequest({ params: { projectId: PROJECT_ID }, query: {} }) as Request;
    const res = createMockResponse();

    await controller.getSuggestedOutreach(req, res);

    expect(getSuggestedOutreachCommentersUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: PROJECT_ID, limit: 20 })
    );
    expect(res.status).not.toHaveBeenCalledWith(400);
    expect(res.status).not.toHaveBeenCalledWith(404);
    expect(res.status).not.toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        commenters: [
          expect.objectContaining({
            author: 'alice',
            sourceType: 'reddit',
            commentCount: 5,
            supportingCount: 3,
            profileUrl: 'https://www.reddit.com/user/alice',
          }),
        ],
      })
    );
  });

  it('returns 400 when projectId is missing', async () => {
    const getPatternCommentsUseCase: IGetPatternCommentsUseCase = { execute: vi.fn() };
    const getSuggestedOutreachCommentersUseCase: IGetSuggestedOutreachCommentersUseCase = { execute: vi.fn() };
    const controller = createController(getPatternCommentsUseCase, undefined, getSuggestedOutreachCommentersUseCase);
    const req = createMockRequest({ params: {} }) as Request;
    const res = createMockResponse();

    await controller.getSuggestedOutreach(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(getSuggestedOutreachCommentersUseCase.execute).not.toHaveBeenCalled();
  });
});
