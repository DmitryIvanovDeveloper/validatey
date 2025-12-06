import { Container } from 'inversify';
import { TYPES } from './types';
import { ReportRepositoryPort } from '../../application/ports/report-repository.port';
import { ReportRepository } from '../repositories/report.repository';
import { ReportPresenter } from '../../interface-adapters/presenters/report.presenter';

export function bindProjectReports(container: Container): void {
  container.bind<ReportRepositoryPort>(TYPES.ReportRepository).to(ReportRepository);
  container.bind<ReportPresenter>(TYPES.ReportPresenter).to(ReportPresenter);
}

