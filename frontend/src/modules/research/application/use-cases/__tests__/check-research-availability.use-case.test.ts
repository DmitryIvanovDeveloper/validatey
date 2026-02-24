import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckResearchAvailabilityUseCase } from '../check-research-availability.use-case';

describe('CheckResearchAvailabilityUseCase', () => {
  let useCase: CheckResearchAvailabilityUseCase;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      checkResearchAvailability: vi.fn()
    };

    useCase = new CheckResearchAvailabilityUseCase(mockRepository);
  });

  describe('execute', () => {
    it('should call repository.checkResearchAvailability with correct projectId', async () => {
      const expectedResponse = {
        available: true,
        timeUntilNext: 0,
        nextAvailableAt: null
      };

      mockRepository.checkResearchAvailability.mockResolvedValue(expectedResponse);

      const request = { projectId: 'project-123' };
      const result = await useCase.execute(request);

      expect(mockRepository.checkResearchAvailability).toHaveBeenCalledWith('project-123');
      expect(mockRepository.checkResearchAvailability).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expectedResponse);
    });

    it('should handle different project IDs', async () => {
      const response1 = { available: true, timeUntilNext: 0, nextAvailableAt: null };
      const response2 = { available: false, timeUntilNext: 3600000, nextAvailableAt: new Date() };

      mockRepository.checkResearchAvailability
        .mockResolvedValueOnce(response1)
        .mockResolvedValueOnce(response2);

      await useCase.execute({ projectId: 'project-456' });
      await useCase.execute({ projectId: 'project-789' });

      expect(mockRepository.checkResearchAvailability).toHaveBeenCalledWith('project-456');
      expect(mockRepository.checkResearchAvailability).toHaveBeenCalledWith('project-789');
      expect(mockRepository.checkResearchAvailability).toHaveBeenCalledTimes(2);
    });

    it('should throw error if repository fails', async () => {
      const error = new Error('Repository failed');
      mockRepository.checkResearchAvailability.mockRejectedValue(error);

      const request = { projectId: 'project-123' };

      await expect(useCase.execute(request)).rejects.toThrow('Repository failed');
    });
  });
});