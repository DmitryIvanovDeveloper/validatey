import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectResearchDataUseCase } from '../collect-research-data.use-case';
import { ResearchStartedEvent } from '../../../domain/events/research-started.event';

describe('CollectResearchDataUseCase', () => {
  let useCase: CollectResearchDataUseCase;
  let mockRepository: any;
  let mockEventBus: any;

  beforeEach(() => {
    // Mock repository
    mockRepository = {
      collectResearchData: vi.fn().mockResolvedValue({
        canvas: { projectId: 'project-123' }
      })
    };

    // Mock EventBus
    mockEventBus = {
      publishAsync: vi.fn().mockResolvedValue(undefined)
    };

    useCase = new CollectResearchDataUseCase(mockRepository, mockEventBus);
  });

  describe('execute', () => {
    it('should publish ResearchStartedEvent before collecting research data', async () => {
      const request = {
        projectId: 'project-123',
        intent: { hypothesis: 'Test hypothesis' }
      };

      await useCase.execute(request);

      // Verify event was published first
      expect(mockEventBus.publishAsync).toHaveBeenCalledWith(
        expect.any(ResearchStartedEvent)
      );
      expect(mockEventBus.publishAsync).toHaveBeenCalledTimes(1);

      // Verify event contains correct projectId
      const publishedEvent = mockEventBus.publishAsync.mock.calls[0][0];
      expect(publishedEvent.projectId).toBe('project-123');
    });

    it('should call repository.collectResearchData after publishing event', async () => {
      const request = {
        projectId: 'project-456',
        intent: { hypothesis: 'Another hypothesis' }
      };

      await useCase.execute(request);

      expect(mockRepository.collectResearchData).toHaveBeenCalledWith(
        'project-456',
        request.intent
      );
      expect(mockRepository.collectResearchData).toHaveBeenCalledTimes(1);
    });

    it('should return successful response when repository succeeds', async () => {
      const expectedCanvas = { projectId: 'project-123', marketData: {} };
      mockRepository.collectResearchData.mockResolvedValue({
        canvas: expectedCanvas
      });

      const request = {
        projectId: 'project-123',
        intent: { hypothesis: 'Test' }
      };

      const result = await useCase.execute(request);

      expect(result).toEqual({
        canvas: expectedCanvas,
        error: undefined
      });
    });

    it('should return error response when repository fails', async () => {
      const error = new Error('Repository failed');
      mockRepository.collectResearchData.mockRejectedValue(error);

      const request = {
        projectId: 'project-123',
        intent: { hypothesis: 'Test' }
      };

      const result = await useCase.execute(request);

      expect(result.error).toBe('Repository failed');
      expect(result.canvas.projectId).toBe('project-123');
    });

    it('should still publish event even if repository fails', async () => {
      mockRepository.collectResearchData.mockRejectedValue(new Error('Fail'));

      const request = {
        projectId: 'project-123',
        intent: { hypothesis: 'Test' }
      };

      await useCase.execute(request);

      // Event should still be published
      expect(mockEventBus.publishAsync).toHaveBeenCalledTimes(1);
    });

    it('should handle different project IDs', async () => {
      const request1 = { projectId: 'project-1', intent: { hypothesis: 'Test 1' } };
      const request2 = { projectId: 'project-2', intent: { hypothesis: 'Test 2' } };

      await useCase.execute(request1);
      await useCase.execute(request2);

      expect(mockEventBus.publishAsync).toHaveBeenCalledTimes(2);
      expect(mockEventBus.publishAsync).toHaveBeenNthCalledWith(1, expect.objectContaining({ projectId: 'project-1' }));
      expect(mockEventBus.publishAsync).toHaveBeenNthCalledWith(2, expect.objectContaining({ projectId: 'project-2' }));
    });
  });
});