import { Container } from 'inversify';
import { TYPES } from './types';
import { OverviewDataProviderPort } from '../../application/ports/overview-data-provider.port';
import { OverviewDataProviderAdapter } from '../adapters/overview-data-provider.adapter';
import { GetOverviewUseCase } from '../../application/use-cases/get-overview.use-case';
import { OverviewController } from '../../interface-adapters/controllers/overview.controller';

export function bindOverview(container: Container): void {
  container.bind<OverviewDataProviderPort>(TYPES.OverviewDataProvider).to(OverviewDataProviderAdapter);
  container.bind<GetOverviewUseCase>(TYPES.GetOverviewUseCase).to(GetOverviewUseCase);
  container.bind<OverviewController>(TYPES.OverviewController).to(OverviewController);
}
