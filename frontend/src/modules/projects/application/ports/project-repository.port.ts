import Result from '../../../../infrastructure/result/result';
import { Project, ProjectStatus, MarketContext } from '../../domain/entities/project.entity';
import { Segment } from '../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../domain/value-objects/hypothesis.vo';
import { ProjectNotFoundError, InvalidProjectDataError, ProjectListError } from '../../domain/errors/project.error';

export interface CreateProjectData {
  name: string;
  workspaceId?: string | null;
  segment: Segment | null;
  hypothesis: Hypothesis | null;
  marketContext?: MarketContext | null;
  status: ProjectStatus;
}

export interface UpdateProjectData {
  name?: string;
  segment?: Segment | null;
  hypothesis?: Hypothesis | null;
  marketContext?: MarketContext | null;
  status?: ProjectStatus;
  scenarioTemplateSlug?: string | null;
  consentText?: string | null;
  dataUsageText?: string | null;
  privacyPolicyUrl?: string | null;
  termsOfServiceUrl?: string | null;
  publicAccessEnabled?: boolean;
  publicSlug?: string | null;
  maxPublicResponses?: number | null;
  requirePublicEmail?: boolean;
  captchaEnabled?: boolean;
}

export interface GetProjectByIdOptions {
  guestSlug?: string;
}

export interface ProjectRepositoryPort {
  create(project: CreateProjectData): Promise<Result<Project, InvalidProjectDataError>>;
  getById(id: string, options?: GetProjectByIdOptions): Promise<Result<Project, ProjectNotFoundError>>;
  getMetaByPublicSlug(slug: string): Promise<Result<{ id: string; name: string; publicSlug: string }, ProjectNotFoundError>>;
  list(): Promise<Result<Project[], ProjectListError>>;
  listByWorkspace(workspaceId: string): Promise<Result<Project[], ProjectListError>>;
  update(id: string, updates: UpdateProjectData): Promise<Result<Project, ProjectNotFoundError | InvalidProjectDataError>>;
  delete(id: string): Promise<Result<void, ProjectNotFoundError | ProjectListError>>;
}

