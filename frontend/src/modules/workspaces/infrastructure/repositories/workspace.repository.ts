import { injectable, inject } from 'inversify';
import { Workspace } from '../../domain/entities/workspace.entity';
import { WorkspaceNotFoundError } from '../../domain/errors/workspace.error';
import { WorkspaceRepositoryPort } from '../../application/ports/workspace-repository.port';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';

@injectable()
export class WorkspaceRepository implements WorkspaceRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async create(workspace: Workspace): Promise<Workspace> {
    console.log('🔍 WORKSPACE REPO: Creating workspace for user:', workspace.userId);
    try {
      const data = await this._httpClient.post<{
        workspace: {
          id: string;
          userId: string;
          name: string;
          iconUrl?: string | null;
          createdAt: string;
          updatedAt: string;
        };
      }>('/workspaces', {
        name: workspace.name,
      });

      console.log('🔍 WORKSPACE REPO: Received response data:', data);
      console.log('🔍 WORKSPACE REPO: Checking data.workspace:', data?.workspace);

      if (!data || !data.workspace) {
        console.error('🔍 WORKSPACE REPO: Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      const result = {
        id: data.workspace.id,
        userId: data.workspace.userId,
        name: data.workspace.name,
        iconUrl: data.workspace.iconUrl ?? null,
        createdAt: new Date(data.workspace.createdAt),
        updatedAt: new Date(data.workspace.updatedAt),
      };

      console.log('🔍 WORKSPACE REPO: Returning workspace:', result);
      return result;
    } catch (error) {
      console.error('🔍 WORKSPACE REPO: Error in create:', error);
      throw error;
    }
  }


  async findById(id: string): Promise<Workspace> {
    try {
      const data = await this._httpClient.get<{
        workspace: {
          id: string;
          userId: string;
          name: string;
          iconUrl?: string | null;
          createdAt: string;
          updatedAt: string;
        };
      }>(`/workspaces/${id}`);

      return {
        id: data.workspace.id,
        userId: data.workspace.userId,
        name: data.workspace.name,
        iconUrl: data.workspace.iconUrl ?? null,
        createdAt: new Date(data.workspace.createdAt),
        updatedAt: new Date(data.workspace.updatedAt),
      };
    } catch (error) {
      if (error instanceof Error && (error.message.includes('404') || error.message.includes('Not Found'))) {
        throw new WorkspaceNotFoundError(id);
      }
      throw error;
    }
  }

  async findByUserId(userId: string): Promise<Workspace[]> {
    console.log('🔍 WORKSPACE REPO: Loading workspaces for user:', userId);
    console.log('🔍 WORKSPACE REPO: Making request to /workspaces');

    // Log current user context for debugging
    const { sessionManager } = await import('../../../../shared/services/session-manager');
    console.log('🔍 WORKSPACE REPO: Current userId from session manager:', sessionManager.currentUserId);

    try {
      const data = await this._httpClient.get<{
        workspaces: Array<{
          id: string;
          userId: string;
          name: string;
          iconUrl?: string | null;
          createdAt: string;
          updatedAt: string;
        }>;
      }>('/workspaces');

      console.log('🔍 WORKSPACE REPO: Received response:', data);
      console.log('🔍 WORKSPACE REPO: Response workspaces count:', data?.workspaces?.length || 0);

      const workspaces = data?.workspaces?.map((workspace) => ({
        id: workspace.id,
        userId: workspace.userId,
        name: workspace.name,
        iconUrl: workspace.iconUrl ?? null,
        createdAt: new Date(workspace.createdAt),
        updatedAt: new Date(workspace.updatedAt),
      })) || [];

      console.log('🔍 WORKSPACE REPO: Mapped workspaces:', workspaces.length);
      return workspaces;
    } catch (error) {
      console.error('🔍 WORKSPACE REPO: Error loading workspaces:', error);
      console.error('🔍 WORKSPACE REPO: Error details:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  async update(workspace: Workspace): Promise<Workspace> {
    const data = await this._httpClient.patch<{
      workspace: {
        id: string;
        userId: string;
        name: string;
        iconUrl: string | null;
        createdAt: string;
        updatedAt: string;
      };
    }>(`/workspaces/${workspace.id}`, {
      name: workspace.name,
      iconUrl: workspace.iconUrl ?? null,
    });

    return {
      id: data.workspace.id,
      userId: data.workspace.userId,
      name: data.workspace.name,
      iconUrl: data.workspace.iconUrl ?? null,
      createdAt: new Date(data.workspace.createdAt),
      updatedAt: new Date(data.workspace.updatedAt),
    };
  }

  async delete(id: string): Promise<void> {
    await this._httpClient.delete(`/workspaces/${id}`, {
      confirmText: 'confirm',
    });
  }

}