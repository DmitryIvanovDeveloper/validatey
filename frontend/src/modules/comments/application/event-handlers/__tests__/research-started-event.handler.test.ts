import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResearchStartedEventHandler } from '../research-started-event.handler';
import { ResearchStartedEvent } from '../../../../research/domain/events/research-started.event';
import { CommentsPresenter } from '../../../interface-adapters/presenters/comments.presenter';

describe('ResearchStartedEventHandler', () => {
  let handler: ResearchStartedEventHandler;
  let mockCommentsPresenter: CommentsPresenter;
  let mockEventBus: any;

  beforeEach(() => {
    // Mock CommentsPresenter
    mockCommentsPresenter = {
      startFetch: vi.fn().mockResolvedValue(undefined)
    } as any;

    // Mock EventBus
    mockEventBus = {
      publishAsync: vi.fn().mockResolvedValue(undefined)
    };

    handler = new ResearchStartedEventHandler(mockCommentsPresenter, mockEventBus);
  });

  describe('canHandle', () => {
    it('should return true for ResearchStartedEvent', () => {
      const event = new ResearchStartedEvent('project-123');
      expect(handler.canHandle(event)).toBe(true);
    });

    it('should return false for other events', () => {
      const event = { type: 'OtherEvent' } as any;
      expect(handler.canHandle(event)).toBe(false);
    });
  });

  describe('handleAsync', () => {
    it('should call commentsPresenter.startFetch and publish ResearchDataCollectionStartedEvent', async () => {
      const event = new ResearchStartedEvent('project-123');

      await handler.handleAsync(event);

      expect(mockCommentsPresenter.startFetch).toHaveBeenCalledWith('project-123');
      expect(mockCommentsPresenter.startFetch).toHaveBeenCalledTimes(1);
      expect(mockEventBus.publishAsync).toHaveBeenCalledTimes(1);
      const publishedEvent = mockEventBus.publishAsync.mock.calls[0][0];
      expect(publishedEvent).toBeInstanceOf(Object);
      expect(publishedEvent.projectId).toBe('project-123');
    });

    it('should throw error if startFetch fails', async () => {
      const error = new Error('Fetch failed');
      mockCommentsPresenter.startFetch = vi.fn().mockRejectedValue(error);

      const event = new ResearchStartedEvent('project-123');

      await expect(handler.handleAsync(event)).rejects.toThrow('Fetch failed');
    });

    it('should handle different project IDs', async () => {
      const event1 = new ResearchStartedEvent('project-456');
      const event2 = new ResearchStartedEvent('project-789');

      await handler.handleAsync(event1);
      await handler.handleAsync(event2);

      expect(mockCommentsPresenter.startFetch).toHaveBeenCalledWith('project-456');
      expect(mockCommentsPresenter.startFetch).toHaveBeenCalledWith('project-789');
      expect(mockCommentsPresenter.startFetch).toHaveBeenCalledTimes(2);
      expect(mockEventBus.publishAsync).toHaveBeenCalledTimes(2);
    });
  });
});