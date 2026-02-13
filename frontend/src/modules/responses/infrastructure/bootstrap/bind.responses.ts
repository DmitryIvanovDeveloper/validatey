import { Container } from 'inversify';
import { ResponseRepository } from '../repositories/response.repository';
import { ExportService } from '../services/export.service';
import { ResponsePresenter } from '../../interface-adapters/presenters/response.presenter';
import { GetResponsesUseCase } from '../../application/use-cases/get-responses.use-case';
import { ExportResponsesUseCase } from '../../application/use-cases/export-responses.use-case';
import { ModerateResponseUseCase } from '../../application/use-cases/moderate-response.use-case';
import { ListResponsesForModerationUseCase } from '../../application/use-cases/list-responses-for-moderation.use-case';
import { GetProjectMetadataUseCase } from '../../application/use-cases/get-project-metadata.use-case';
import { TYPES } from './types';

export function bindResponses(container: Container): void {
  // Repositories
  container.bind(TYPES.ResponseRepository).to(ResponseRepository).inSingletonScope();

  // Services
  container.bind(TYPES.ExportService).to(ExportService).inSingletonScope();

  // Use Cases
  container.bind(GetResponsesUseCase).toSelf();
  container.bind(ExportResponsesUseCase).toSelf();
  container.bind(ModerateResponseUseCase).toSelf();
  container.bind(ListResponsesForModerationUseCase).toSelf();
  container.bind(GetProjectMetadataUseCase).toSelf();

  // Presenters
  container.bind(TYPES.ResponsePresenter).to(ResponsePresenter).inSingletonScope();
}