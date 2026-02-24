import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { ProjectOverviewRepositoryPort } from '../ports/project-overview-repository.port';
import type { OverviewLoadError } from '../../domain/errors/project.error';
import type { GetProjectOverviewRequest, GetProjectOverviewResponse } from './input-output/get-project-overview.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetProjectOverviewUseCase {
  constructor(
    @inject(TYPES.ProjectOverviewRepository)
    private readonly _repository: ProjectOverviewRepositoryPort
  ) {}

  async execute(
    input: GetProjectOverviewRequest
  ): Promise<Result<GetProjectOverviewResponse, OverviewLoadError>> {
    const result = await this._repository.getOverview(input.projectId);

    if (!result.isSuccess) {
      return Result.failure(result.error);
    }

    return Result.success({ overview: result.data });
  }
}
