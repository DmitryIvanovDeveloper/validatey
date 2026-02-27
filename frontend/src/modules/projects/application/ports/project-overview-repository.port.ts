import type Result from '../../../../infrastructure/result/result';
import type { OverviewPayload } from '../use-cases/input-output/get-project-overview.io';
import type { OverviewLoadError } from '../../domain/errors/project.error';

export interface ProjectOverviewRepositoryPort {
  getOverview(projectId: string, guestSlug?: string): Promise<Result<OverviewPayload, OverviewLoadError>>;
}
