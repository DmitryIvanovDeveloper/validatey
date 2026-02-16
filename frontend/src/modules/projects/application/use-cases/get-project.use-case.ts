import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { ProjectNotFoundError } from '../../domain/errors/project.error';
import { GetProjectUseCaseRequest, GetProjectUseCaseResponse } from './input-output/get-project.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetProjectUseCase {
  constructor(
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort
  ) {}

  async execute(input: GetProjectUseCaseRequest): Promise<Result<GetProjectUseCaseResponse, ProjectNotFoundError>> {
    const result = await this._repository.getById(input.projectId);

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
        marketContext: project.marketContext ?? null,
        status: project.status,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        publicAccessEnabled: project.publicAccessEnabled,
        publicSlug: project.publicSlug ?? null,
        maxPublicResponses: project.maxPublicResponses ?? null,
        requirePublicEmail: project.requirePublicEmail,
        captchaEnabled: project.captchaEnabled,
        scenarioTemplateSlug: project.scenarioTemplateSlug ?? null,
      }
    });
  }
}

