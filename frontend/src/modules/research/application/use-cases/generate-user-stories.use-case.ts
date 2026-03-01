import { inject, injectable } from 'inversify';
import type { ResearchRepositoryPort } from '../ports/research-repository.port';
import type {
  GenerateUserStoriesRequest,
  GenerateUserStoriesResponse,
} from './input-output/generate-user-stories.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import ResultEx from '../../../../shared/result';

@injectable()
export class GenerateUserStoriesUseCase {
  constructor(
    @inject(TYPES.ResearchRepositoryPort)
    private readonly _researchRepository: ResearchRepositoryPort
  ) {}

  async execute(request: GenerateUserStoriesRequest): Promise<ResultEx<GenerateUserStoriesResponse, Error>> {
    try {
      const result = await this._researchRepository.generateUserStories(request.projectId);

      return ResultEx.success(result);
    } catch (error) {
      return ResultEx.failure(
        error instanceof Error
          ? error
          : new Error('Failed to generate user stories')
      );
    }
  }
}