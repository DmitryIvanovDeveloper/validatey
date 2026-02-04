import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectNotFoundError, InvalidProjectDataError } from '../../domain/errors/project.error';
import type { UpdateProjectUseCaseRequest, UpdateProjectUseCaseResponse } from './input-output/update-project.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class UpdateProjectUseCase {
  constructor(
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(input: UpdateProjectUseCaseRequest): Promise<Result<UpdateProjectUseCaseResponse, ProjectNotFoundError | InvalidProjectDataError>> {
    const result = await this._repository.update(input.projectId, {
      name: input.updates.name,
      segment: input.updates.segment,
      hypothesis: input.updates.hypothesis,
      marketContext: input.updates.marketContext,
      status: input.updates.status,
      scenarioTemplateSlug: input.updates.scenarioTemplateSlug,
    });

    if (!result.isSuccess) {
      return Result.failure(result.error);
    }

    const project = result.data;

    return Result.success({
      project: {
        id: project.id,
        name: project.name,
        segment: project.segment ? {
          description: project.segment.description,
          demographics: project.segment.demographics
        } : null,
        hypothesis: project.hypothesis ? {
          description: project.hypothesis.description,
          assumptions: project.hypothesis.assumptions
        } : null,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      }
    });
  }
}

