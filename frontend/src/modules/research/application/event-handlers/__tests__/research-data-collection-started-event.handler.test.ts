import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ResearchDataCollectionStartedEventHandler } from '../research-data-collection-started-event.handler';
import { ResearchDataCollectionStartedEvent } from '../../../domain/events/research-data-collection-started.event';
import { ResearchPresenter } from '../../../interface-adapters/presenters/research.presenter';

describe('ResearchDataCollectionStartedEventHandler', () => {
  let handler: ResearchDataCollectionStartedEventHandler;
  let mockResearchPresenter: ResearchPresenter;

  beforeEach(() => {
    // Mock ResearchPresenter
    mockResearchPresenter = {
      setResearchLoading: vi.fn().mockResolvedValue(undefined),
      setCommentsOnlyLoading: vi.fn().mockResolvedValue(undefined),
      viewModel: {
        researchLoading: false,
        commentsOnlyLoading: true,
      },
    } as any;

    handler = new ResearchDataCollectionStartedEventHandler(mockResearchPresenter);
  });

  describe('canHandle', () => {
    it('should return true for ResearchDataCollectionStartedEvent', () => {
      const event = new ResearchDataCollectionStartedEvent('project-123');
      expect(handler.canHandle(event)).toBe(true);
    });

    it('should return false for other events', () => {
      const event = { type: 'OtherEvent' } as any;
      expect(handler.canHandle(event)).toBe(false);
    });
  });

  describe('handleAsync', () => {
    it('should call researchPresenter methods to transition from comments-only to research loading', async () => {
      const event = new ResearchDataCollectionStartedEvent('project-123');

      await handler.handleAsync(event);

      expect(mockResearchPresenter.setResearchLoading).toHaveBeenCalledWith('project-123', true);
      expect(mockResearchPresenter.setResearchLoading).toHaveBeenCalledTimes(1);
      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledWith('project-123', false);
      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledTimes(1);
    });

    it('should handle different project IDs', async () => {
      const event1 = new ResearchDataCollectionStartedEvent('project-456');
      const event2 = new ResearchDataCollectionStartedEvent('project-789');

      await handler.handleAsync(event1);
      await handler.handleAsync(event2);

      expect(mockResearchPresenter.setResearchLoading).toHaveBeenCalledWith('project-456', true);
      expect(mockResearchPresenter.setResearchLoading).toHaveBeenCalledWith('project-789', true);
      expect(mockResearchPresenter.setResearchLoading).toHaveBeenCalledTimes(2);
      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledWith('project-456', false);
      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledWith('project-789', false);
      expect(mockResearchPresenter.setCommentsOnlyLoading).toHaveBeenCalledTimes(2);
    });

    it('should throw error if presenter methods fail', async () => {
      const error = new Error('Presenter failed');
      mockResearchPresenter.setResearchLoading = vi.fn().mockRejectedValue(error);

      const event = new ResearchDataCollectionStartedEvent('project-123');

      await expect(handler.handleAsync(event)).rejects.toThrow('Presenter failed');
    });
  });
});