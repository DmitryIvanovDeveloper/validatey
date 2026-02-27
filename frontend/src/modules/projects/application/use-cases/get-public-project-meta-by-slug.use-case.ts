import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectNotFoundError } from '../../domain/errors/project.error';
import type {
  GetPublicProjectMetaBySlugRequest,
  GetPublicProjectMetaBySlugResponse,
} from './input-output/get-public-project-meta-by-slug.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetPublicProjectMetaBySlugUseCase {
  constructor(
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(
    input: GetPublicProjectMetaBySlugRequest
  ): Promise<Result<GetPublicProjectMetaBySlugResponse, ProjectNotFoundError>> {
    const result = await this._repository.getMetaByPublicSlug(input.slug);
    if (!result.isSuccess) return Result.failure(result.error);
    return Result.success(result.data);
  }
}
