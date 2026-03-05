import { injectable, inject } from 'inversify';
import { TYPES } from '../../application/types';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import type { WishlistRepositoryPort } from '../ports/wishlist-repository.port';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { ProjectNotFoundError, ProjectAccessDeniedError } from '../../../projects/domain/errors/project.error';
import ResultEx from '../../../../infrastructure/result/result';
import type {
  ListProjectWishlistRequest,
  ListProjectWishlistResponse,
  ListProjectWishlistEntryDto,
} from './input-output/list-project-wishlist.io';

@injectable()
export class ListProjectWishlistUseCase {
  constructor(
    @inject(TYPES.WishlistRepository)
    private readonly _wishlistRepository: WishlistRepositoryPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort
  ) {}

  async execute(
    request: ListProjectWishlistRequest
  ): Promise<ResultEx<ListProjectWishlistResponse, ProjectNotFoundError | ProjectAccessDeniedError | Error>> {
    const accessResult = await this._projectRepository.userHasAccessToProject(request.projectId, request.userId);
    if (!accessResult.isSuccess) {
      return ResultEx.failure(accessResult.error);
    }
    if (!accessResult.data) {
      return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
    }

    const result = await this._wishlistRepository.findAll(500, 0, request.projectId);
    if (!result.isSuccess) {
      return ResultEx.failure(result.error);
    }

    const entries: ListProjectWishlistEntryDto[] = result.data.map((e) => ({
      id: e.id,
      email: e.email,
      projectId: e.projectId,
      createdAt: e.createdAt.toISOString(),
    }));

    return ResultEx.success({ entries });
  }
}
