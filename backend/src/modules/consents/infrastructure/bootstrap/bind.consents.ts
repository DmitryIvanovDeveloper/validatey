import { Container } from 'inversify';
import { TYPES } from './types';
import { ConsentRepositoryPort } from '../../application/ports/consent-repository.port';
import { ConsentRequirementsPort } from '../../application/ports/consent-requirements.port';
import { SupabaseConsentRepository } from '../repositories/supabase-consent.repository';
import { ProjectConsentRequirementsAdapter } from '../services/project-consent-requirements.adapter';
import { RecordConsentUseCase } from '../../application/use-cases/record-consent.use-case';
import { GetConsentRequirementsUseCase } from '../../application/use-cases/get-consent-requirements.use-case';
import { ExportConsentsUseCase } from '../../application/use-cases/export-consents.use-case';
import { ConsentController } from '../../interface-adapters/controllers/consent.controller';

export function bindConsents(container: Container): void {
  container.bind<ConsentRepositoryPort>(TYPES.ConsentRepository).to(SupabaseConsentRepository);
  container.bind<ConsentRequirementsPort>(TYPES.ConsentRequirements).to(ProjectConsentRequirementsAdapter);

  container.bind<RecordConsentUseCase>(TYPES.RecordConsentUseCase).to(RecordConsentUseCase);
  container.bind<GetConsentRequirementsUseCase>(TYPES.GetConsentRequirementsUseCase).to(GetConsentRequirementsUseCase);
  container.bind<ExportConsentsUseCase>(TYPES.ExportConsentsUseCase).to(ExportConsentsUseCase);

  container.bind<ConsentController>(TYPES.ConsentController).to(ConsentController);
}
