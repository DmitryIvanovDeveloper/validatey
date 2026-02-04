import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ScenarioRatingRepositoryPort } from '../ports/scenario-rating-repository.port';
import type { SaveScenarioRatingUseCaseInput, SaveScenarioRatingUseCaseOutput } from './input-output/save-scenario-rating.io';

@injectable()
export class SaveScenarioRatingUseCase {
  constructor(
    @inject(TYPES.ScenarioRatingRepository)
    private readonly _repository: ScenarioRatingRepositoryPort
  ) {}

  async execute(
    input: SaveScenarioRatingUseCaseInput
  ): Promise<{ isSuccess: true; data: SaveScenarioRatingUseCaseOutput } | { isSuccess: false; error: string }> {
    const { projectId, scenarioId, rating, userId } = input;
    if (rating < 1 || rating > 5) {
      return { isSuccess: false, error: 'Rating must be between 1 and 5' };
    }
    const result = await this._repository.save({ projectId, scenarioId, rating, userId });
    if ('error' in result) {
      return { isSuccess: false, error: result.error };
    }
    return { isSuccess: true, data: { id: result.id } };
  }
}
