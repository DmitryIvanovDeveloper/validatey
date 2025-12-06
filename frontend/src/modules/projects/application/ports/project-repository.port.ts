import Result from '../../../../infrastructure/result/result';
import { Project, ProjectStatus } from '../../domain/entities/project.entity';
import { Segment } from '../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../domain/value-objects/hypothesis.vo';
import { ProjectNotFoundError, InvalidProjectDataError } from '../../domain/errors/project.error';

export interface CreateProjectData {
  name: string;
  segment: Segment | null;
  hypothesis: Hypothesis | null;
  status: ProjectStatus;
}

export interface UpdateProjectData {
  name?: string;
  segment?: Segment | null;
  hypothesis?: Hypothesis | null;
  status?: ProjectStatus;
}

export interface ProjectRepositoryPort {
  create(project: CreateProjectData): Promise<Result<Project, InvalidProjectDataError>>;
  getById(id: string): Promise<Result<Project, ProjectNotFoundError>>;
  list(): Promise<Result<Project[], never>>;
  update(id: string, updates: UpdateProjectData): Promise<Result<Project, ProjectNotFoundError | InvalidProjectDataError>>;
}

