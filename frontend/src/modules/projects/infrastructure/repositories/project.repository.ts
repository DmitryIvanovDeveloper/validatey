import { injectable, inject } from 'inversify';
import type { ProjectRepositoryPort, CreateProjectData, UpdateProjectData } from '../../application/ports/project-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { Project, ProjectStatus } from '../../domain/entities/project.entity';
import { Segment } from '../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../domain/value-objects/hypothesis.vo';
import { ProjectNotFoundError, InvalidProjectDataError, ProjectListError } from '../../domain/errors/project.error';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';

@injectable()
export class ProjectRepository implements ProjectRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async create(project: CreateProjectData): Promise<Result<Project, InvalidProjectDataError>> {
    try {
      const response = await this._httpClient.post<{
        id: string;
        name: string;
        segment: { description: string; demographics: Record<string, any> } | null;
        hypothesis: { description: string; assumptions: string[] } | null;
        marketContext?: { marketPicture?: string; marketFit?: string; differentiation?: string } | null;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>(API_CONFIG.ENDPOINTS.PROJECTS, {
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
        status: project.status
      });

      const createdAt = response.createdAt != null ? new Date(response.createdAt) : new Date();
      const updatedAt = response.updatedAt != null ? new Date(response.updatedAt) : new Date();
      const domainProject = new Project(
        response.id,
        response.name,
        response.segment ? new Segment(response.segment.description, response.segment.demographics) : null,
        response.hypothesis ? new Hypothesis(response.hypothesis.description, response.hypothesis.assumptions) : null,
        response.marketContext ?? null,
        response.status as ProjectStatus,
        createdAt,
        updatedAt
      );

      return Result.success(domainProject);
    } catch (error) {
      return Result.failure(new InvalidProjectDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async getById(id: string): Promise<Result<Project, ProjectNotFoundError>> {
    try {
      const response = await this._httpClient.get<{
        project: {
          id: string;
          name: string;
          segment: { description: string; demographics: Record<string, any> } | null;
          hypothesis: { description: string; assumptions: string[] } | null;
          marketContext?: { marketPicture?: string; marketFit?: string; differentiation?: string } | null;
          status: string;
          createdAt: string;
          updatedAt: string;
        };
      }>(API_CONFIG.ENDPOINTS.PROJECT(id));

      const projectData = response.project;
      const createdAt = projectData.createdAt != null ? new Date(projectData.createdAt) : new Date();
      const updatedAt = projectData.updatedAt != null ? new Date(projectData.updatedAt) : new Date();
      const domainProject = new Project(
        projectData.id,
        projectData.name,
        projectData.segment ? new Segment(projectData.segment.description, projectData.segment.demographics) : null,
        projectData.hypothesis ? new Hypothesis(projectData.hypothesis.description, projectData.hypothesis.assumptions) : null,
        projectData.marketContext ?? null,
        projectData.status as ProjectStatus,
        createdAt,
        updatedAt
      );

      return Result.success(domainProject);
    } catch (error) {
      return Result.failure(new ProjectNotFoundError(id));
    }
  }

  async list(): Promise<Result<Project[], ProjectListError>> {
    try {
      const url =
        import.meta.env.DEV && typeof API_CONFIG.ENDPOINTS.PROJECTS === 'string'
          ? `${API_CONFIG.ENDPOINTS.PROJECTS}?list=all`
          : API_CONFIG.ENDPOINTS.PROJECTS;
      const response = await this._httpClient.get<Array<{
        id: string;
        name: string;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>>(url);

      if (!Array.isArray(response)) {
        return Result.failure(new ProjectListError('Invalid response: expected array of projects'));
      }

      const projects = response.map(p => {
        const createdAt = p.createdAt != null ? new Date(p.createdAt) : new Date();
        const updatedAt = p.updatedAt != null ? new Date(p.updatedAt) : new Date();
        return new Project(
          p.id,
          p.name,
          null,
          null,
          null,
          p.status as ProjectStatus,
          createdAt,
          updatedAt
        );
      });

      return Result.success(projects);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load projects';
      return Result.failure(new ProjectListError(message));
    }
  }

  async update(id: string, updates: UpdateProjectData): Promise<Result<Project, ProjectNotFoundError | InvalidProjectDataError>> {
    try {
      const response = await this._httpClient.put<{
        id: string;
        name: string;
        segment: { description: string; demographics: Record<string, any> } | null;
        hypothesis: { description: string; assumptions: string[] } | null;
        marketContext?: { marketPicture?: string; marketFit?: string; differentiation?: string } | null;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>(API_CONFIG.ENDPOINTS.PROJECT(id), updates);

      const createdAt = response.createdAt != null ? new Date(response.createdAt) : new Date();
      const updatedAt = response.updatedAt != null ? new Date(response.updatedAt) : new Date();
      const domainProject = new Project(
        response.id,
        response.name,
        response.segment ? new Segment(response.segment.description, response.segment.demographics) : null,
        response.hypothesis ? new Hypothesis(response.hypothesis.description, response.hypothesis.assumptions) : null,
        response.marketContext ?? null,
        response.status as ProjectStatus,
        createdAt,
        updatedAt
      );

      return Result.success(domainProject);
    } catch (error) {
      return Result.failure(new ProjectNotFoundError(id));
    }
  }

  async delete(id: string): Promise<Result<void, ProjectNotFoundError | ProjectListError>> {
    try {
      await this._httpClient.delete(API_CONFIG.ENDPOINTS.PROJECT(id));
      return Result.success(undefined);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('404') || message.includes('not found')) {
        return Result.failure(new ProjectNotFoundError(id));
      }
      return Result.failure(new ProjectListError(message));
    }
  }
}

