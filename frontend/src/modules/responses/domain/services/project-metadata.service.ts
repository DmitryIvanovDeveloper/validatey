import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';

export interface ProjectMetadata {
  significanceTarget: number;
  deadline?: Date;
}

export interface ProjectMetadataServicePort {
  getProjectMetadata(projectId: string): Promise<ResultEx<ProjectMetadata, Error>>;
}

@injectable()
export class ProjectMetadataService implements ProjectMetadataServicePort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async getProjectMetadata(projectId: string): Promise<ResultEx<ProjectMetadata, Error>> {
    try {
      // TODO: Implement actual project metadata retrieval
      // For now, return default values
      this._logger.info('ProjectMetadataService.getProjectMetadata', { projectId });

      return ResultEx.success({
        significanceTarget: 50, // Default significance target
        deadline: undefined
      });
    } catch (error) {
      this._logger.error('ProjectMetadataService.getProjectMetadata.error', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}