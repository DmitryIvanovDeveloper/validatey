import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommentsFetchStartedEventHandler } from '../comments-fetch-started-event.handler';
import { CommentsFetchStartedEvent } from '../../../../comments/domain/events/comments-fetch-started.event';
import { ResearchPresenter } from '../../../interface-adapters/presenters/research.presenter';

describe('CommentsFetchStartedEventHandler', () => {
  let handler: CommentsFetchStartedEventHandler;
  let mockResearchPresenter: ResearchPresenter;

  beforeEach(() => {
    // Mock ResearchPresenter
    mockResearchPresenter = {
      setCommentsFetchStatus: vi.fn().mockResolvedValue(undefined),
      setCommentsOnlyLoading: vi.fn().mockResolvedValue(undefined),
      viewModel: {
        commentsFetching: false,
      },
    } as any;

    handler = new CommentsFetchStartedEventHandler(mockResearchPresenter);
  });

  describe('canHandle', () => {
    it('should return true for CommentsFetchStartedEvent', () => {
      const event = new CommentsFetchStartedEvent('project-123');
      expect(handler.canHandle(event)).toBe(true);
    });

    it('should return false for other events', () => {
      const event = { type: 'OtherEvent' } as any;
      expect(handler.canHandle(event)).toBe(false);
    });
  });

  describe('handleAsync', () => {
    it('should call researchPresenter methods with correct projectId', async () => {
      const event = new CommentsFetchStartedEvent('project-123');

      await handler.handleAsync(event);

      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledWith('project-123', true);
      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledTimes(1);
      expect(mockResearchPresenter.setCommentsFetchStatus).toHaveBeenCalledWith('project-123', true);
      expect(mockResearchPresenter.setCommentsFetchStatus).toHaveBeenCalledTimes(1);
    });

    it('should handle different project IDs', async () => {
      const event1 = new CommentsFetchStartedEvent('project-456');
      const event2 = new CommentsFetchStartedEvent('project-789');

      await handler.handleAsync(event1);
      await handler.handleAsync(event2);

      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledWith('project-456', true);
      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledWith('project-789', true);
      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledTimes(2);
      expect(mockResearchPresenter.setCommentsFetchStatus).toHaveBeenCalledWith('project-456', true);
      expect(mockResearchPresenter.setCommentsFetchStatus).toHaveBeenCalledWith('project-789', true);
      expect(mockResearchPresenter.setCommentsFetchStatus).toHaveBeenCalledTimes(2);
    });

    it('should throw error if presenter methods fail', async () => {
      const error = new Error('Presenter failed');
      mockResearchPresenter.setCommentsOnlyLoading = vi.fn().mockRejectedValue(error);

      const event = new CommentsFetchStartedEvent('project-123');

      await expect(handler.handleAsync(event)).rejects.toThrow('Presenter failed');
    });
  });
});