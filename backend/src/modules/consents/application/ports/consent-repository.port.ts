import ResultEx from '../../../../infrastructure/result/result';
import { Consent } from '../../domain/entities/consent.entity';
import { InvalidConsentDataError } from '../../domain/errors/consent.error';

export interface ConsentRepositoryPort {
  save(consent: Consent): Promise<ResultEx<Consent, InvalidConsentDataError>>;
  findByInvitationId(invitationId: string): Promise<ResultEx<Consent | null, Error>>;
  listByProjectId(projectId: string): Promise<ResultEx<Consent[], Error>>;
}
