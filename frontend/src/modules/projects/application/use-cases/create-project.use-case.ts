import { injectable, inject } from 'inversify';
import Result from '../../../../infrastructure/result/result';
import type { ProjectRepositoryPort } from '../ports/project-repository.port';
import { Project, ProjectStatus } from '../../domain/entities/project.entity';
import { InvalidProjectDataError } from '../../domain/errors/project.error';
import type { CreateProjectUseCaseRequest, CreateProjectUseCaseResponse } from './input-output/create-project.io';
import type { EventBusPort } from '../../../../infrastructure/event-bus/ports/event-bus.port';
import { ProjectCreatedEvent } from '../events/project-created-event';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class CreateProjectUseCase {
  constructor(
    @inject(TYPES.ProjectRepository)
    private readonly _repository: ProjectRepositoryPort,
    @inject(ROOT_TYPES.EventBus)
    private readonly _eventBus: EventBusPort
  ) {}

  async execute(input: CreateProjectUseCaseRequest): Promise<Result<CreateProjectUseCaseResponse, InvalidProjectDataError>> {
    try {
      // Don't create domain entity with empty ID, use DTO directly
      const result = await this._repository.create({
        name: input.name,
        workspaceId: input.workspaceId ?? null,
        segment: null,
        hypothesis: null,
        status: 'draft' as ProjectStatus
      });

      if (!result.isSuccess) {
        return Result.failure(result.error);
      }

      const createdProject = result.data;

      // Publish event
      this._eventBus.publish(new ProjectCreatedEvent(createdProject.id));

      const createdAt = createdProject.createdAt != null && typeof createdProject.createdAt.toISOString === 'function'
        ? createdProject.createdAt.toISOString()
        : new Date().toISOString();
      const updatedAt = createdProject.updatedAt != null && typeof createdProject.updatedAt.toISOString === 'function'
        ? createdProject.updatedAt.toISOString()
        : new Date().toISOString();
      return Result.success({
        project: {
          id: createdProject.id,
          name: createdProject.name,
          status: createdProject.status,
          createdAt,
          updatedAt
        }
      });
    } catch (error) {
      return Result.failure(new InvalidProjectDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}

