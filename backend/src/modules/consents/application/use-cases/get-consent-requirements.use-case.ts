import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ConsentRequirementsPort } from '../ports/consent-requirements.port';
import { ConsentRepositoryPort } from '../ports/consent-repository.port';
import { InvitationRepositoryPort } from '../../../invitations/application/ports/invitation-repository.port';
import {
  GetConsentRequirementsUseCaseRequest,
  GetConsentRequirementsUseCaseResponse,
} from './input-output/get-consent-requirements.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import { InvalidConsentDataError } from '../../domain/errors/consent.error';

@injectable()
export class GetConsentRequirementsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ConsentRepository)
    private readonly _consentRepository: ConsentRepositoryPort,
    @inject(TYPES.ConsentRequirements)
    private readonly _consentRequirements: ConsentRequirementsPort,
    @inject(INVITATION_TYPES.InvitationRepository)
    private readonly _invitationRepository: InvitationRepositoryPort
  ) {}

  async execute(
    request: GetConsentRequirementsUseCaseRequest
  ): Promise<ResultEx<GetConsentRequirementsUseCaseResponse, InvalidConsentDataError>> {
    this._logger.info('get-consent-requirements.start', { token: request.token.substring(0, 10) + '...' });

    const invitationResult = await this._invitationRepository.findByToken(request.token);
    if (!invitationResult.isSuccess) {
      return ResultEx.failure(new InvalidConsentDataError('Invalid invitation token'));
    }
    const invitation = invitationResult.data;

    const requirementsResult = await this._consentRequirements.getByProjectId(invitation.projectId);
    if (!requirementsResult.isSuccess) {
      this._logger.error('get-consent-requirements.requirements-error', {
        projectId: invitation.projectId,
        error: requirementsResult.error,
      });
      return ResultEx.failure(new InvalidConsentDataError('Failed to load consent requirements'));
    }
    const { consentText, dataUsageText, privacyPolicyUrl, termsOfServiceUrl } = requirementsResult.data;

    const existingConsentResult = await this._consentRepository.findByInvitationId(invitation.id);
    if (!existingConsentResult.isSuccess) {
      return ResultEx.failure(new InvalidConsentDataError('Failed to check consent status'));
    }
    const alreadyConsented = existingConsentResult.data !== null;

    const consentRequired = consentText.trim().length > 0 && !alreadyConsented;

    this._logger.info('get-consent-requirements.success', {
      projectId: invitation.projectId,
      consentRequired,
      alreadyConsented,
    });

    return ResultEx.success({
      consentRequired,
      consentText,
      dataUsageText,
      privacyPolicyUrl: privacyPolicyUrl ?? null,
      termsOfServiceUrl: termsOfServiceUrl ?? null,
      alreadyConsented,
    });
  }
}
