import { injectable, inject } from 'inversify';
import type { ProjectRepositoryPort, CreateProjectData, UpdateProjectData } from '../../application/ports/project-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import Result from '../../../../infrastructure/result/result';
import { Project, ProjectStatus } from '../../domain/entities/project.entity';
import { Segment } from '../../domain/value-objects/segment.vo';
import { Hypothesis } from '../../domain/value-objects/hypothesis.vo';
import { ProjectNotFoundError, InvalidProjectDataError } from '../../domain/errors/project.error';
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
        status: project.status
      });

      const domainProject = new Project(
        response.id,
        response.name,
        response.segment ? new Segment(response.segment.description, response.segment.demographics) : null,
        response.hypothesis ? new Hypothesis(response.hypothesis.description, response.hypothesis.assumptions) : null,
        response.status as ProjectStatus,
        new Date(response.createdAt),
        new Date(response.updatedAt)
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
          status: string;
          createdAt: string;
          updatedAt: string;
        };
      }>(API_CONFIG.ENDPOINTS.PROJECT(id));

      const projectData = response.project;
      const domainProject = new Project(
        projectData.id,
        projectData.name,
        projectData.segment ? new Segment(projectData.segment.description, projectData.segment.demographics) : null,
        projectData.hypothesis ? new Hypothesis(projectData.hypothesis.description, projectData.hypothesis.assumptions) : null,
        projectData.status as ProjectStatus,
        new Date(projectData.createdAt),
        new Date(projectData.updatedAt)
      );

      return Result.success(domainProject);
    } catch (error) {
      return Result.failure(new ProjectNotFoundError(id));
    }
  }

  async list(): Promise<Result<Project[], never>> {
    try {
      const response = await this._httpClient.get<Array<{
        id: string;
        name: string;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>>(API_CONFIG.ENDPOINTS.PROJECTS);

      const projects = response.map(p => new Project(
        p.id,
        p.name,
        null,
        null,
        p.status as ProjectStatus,
        new Date(p.createdAt),
        new Date(p.updatedAt)
      ));

      return Result.success(projects);
    } catch (error) {
      return Result.success([]);
    }
  }

  async update(id: string, updates: UpdateProjectData): Promise<Result<Project, ProjectNotFoundError | InvalidProjectDataError>> {
    try {
      const response = await this._httpClient.put<{
        id: string;
        name: string;
        segment: { description: string; demographics: Record<string, any> } | null;
        hypothesis: { description: string; assumptions: string[] } | null;
        status: string;
        createdAt: string;
        updatedAt: string;
      }>(API_CONFIG.ENDPOINTS.PROJECT(id), updates);

      const domainProject = new Project(
        response.id,
        response.name,
        response.segment ? new Segment(response.segment.description, response.segment.demographics) : null,
        response.hypothesis ? new Hypothesis(response.hypothesis.description, response.hypothesis.assumptions) : null,
        response.status as ProjectStatus,
        new Date(response.createdAt),
        new Date(response.updatedAt)
      );

      return Result.success(domainProject);
    } catch (error) {
      return Result.failure(new ProjectNotFoundError(id));
    }
  }
}

