import { describe, it, expect, vi } from 'vitest';
import ResultEx from '../../../../infrastructure/result/result';
import { GetConsentRequirementsUseCase } from './get-consent-requirements.use-case';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { ConsentRepositoryPort } from '../ports/consent-repository.port';
import type { ConsentRequirementsPort } from '../ports/consent-requirements.port';
import type { InvitationRepositoryPort } from '../../../invitations/application/ports/invitation-repository.port';
import type { Invitation } from '../../../invitations/domain/entities/invitation.entity';

const TOKEN = 'test_token_123';
const INVITATION_ID = 'inv_abc';
const PROJECT_ID = 'proj_xyz';

const mockInvitation: Invitation = {
  id: INVITATION_ID,
  projectId: PROJECT_ID,
  token: TOKEN,
  email: 'test@example.com',
  phone: null,
  status: 'sent',
  sentAt: null,
  openedAt: null,
  completedAt: null,
  reminderCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createUseCase(mocks: {
  invitationRepository: InvitationRepositoryPort;
  consentRequirements: ConsentRequirementsPort;
  consentRepository: ConsentRepositoryPort;
  logger?: LoggerPort;
}): GetConsentRequirementsUseCase {
  const logger: LoggerPort = mocks.logger ?? {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  };
  return new GetConsentRequirementsUseCase(
    logger as any,
    mocks.consentRepository,
    mocks.consentRequirements,
    mocks.invitationRepository
  );
}

describe('GetConsentRequirementsUseCase', () => {
  describe('consent screen visibility (per invitation link)', () => {
    it('returns consentRequired true and alreadyConsented false when no consent record exists for this invitation', async () => {
      const invitationRepository: InvitationRepositoryPort = {
        findByToken: vi.fn().mockResolvedValue(ResultEx.success(mockInvitation)),
      } as any;
      const consentRequirements: ConsentRequirementsPort = {
        getByProjectId: vi.fn().mockResolvedValue(
          ResultEx.success({
            consentText: 'I agree to participate.',
            dataUsageText: 'We use your data for research.',
            privacyPolicyUrl: null,
            termsOfServiceUrl: null,
          })
        ),
      } as any;
      const consentRepository: ConsentRepositoryPort = {
        findByInvitationId: vi.fn().mockResolvedValue(ResultEx.success(null)), // no consent saved
        save: vi.fn(),
        listByProjectId: vi.fn(),
      } as any;

      const useCase = createUseCase({
        invitationRepository,
        consentRequirements,
        consentRepository,
      });

      const result = await useCase.execute({ token: TOKEN });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.data.consentRequired).toBe(true);
        expect(result.data.alreadyConsented).toBe(false);
      }
      expect(consentRepository.findByInvitationId).toHaveBeenCalledWith(INVITATION_ID);
    });

    it('returns consentRequired false and alreadyConsented true when consent record exists for this invitation', async () => {
      const invitationRepository: InvitationRepositoryPort = {
        findByToken: vi.fn().mockResolvedValue(ResultEx.success(mockInvitation)),
      } as any;
      const consentRequirements: ConsentRequirementsPort = {
        getByProjectId: vi.fn().mockResolvedValue(
          ResultEx.success({
            consentText: 'I agree to participate.',
            dataUsageText: 'We use your data for research.',
            privacyPolicyUrl: null,
            termsOfServiceUrl: null,
          })
        ),
      } as any;
      const consentRepository: ConsentRepositoryPort = {
        findByInvitationId: vi.fn().mockResolvedValue(
          ResultEx.success({
            id: 'consent_1',
            projectId: PROJECT_ID,
            invitationId: INVITATION_ID,
            consentTextId: null,
            consentText: 'I agree to participate.',
            acceptedAt: new Date(),
            ip: null,
            userAgent: null,
            createdAt: new Date(),
          } as any)
        ), // consent already saved for this invitation
        save: vi.fn(),
        listByProjectId: vi.fn(),
      } as any;

      const useCase = createUseCase({
        invitationRepository,
        consentRequirements,
        consentRepository,
      });

      const result = await useCase.execute({ token: TOKEN });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.data.consentRequired).toBe(false);
        expect(result.data.alreadyConsented).toBe(true);
      }
      expect(consentRepository.findByInvitationId).toHaveBeenCalledWith(INVITATION_ID);
    });

    it('returns consentRequired false when project has no consent text (empty string)', async () => {
      const invitationRepository: InvitationRepositoryPort = {
        findByToken: vi.fn().mockResolvedValue(ResultEx.success(mockInvitation)),
      } as any;
      const consentRequirements: ConsentRequirementsPort = {
        getByProjectId: vi.fn().mockResolvedValue(
          ResultEx.success({
            consentText: '',
            dataUsageText: '',
            privacyPolicyUrl: null,
            termsOfServiceUrl: null,
          })
        ),
      } as any;
      const consentRepository: ConsentRepositoryPort = {
        findByInvitationId: vi.fn().mockResolvedValue(ResultEx.success(null)),
        save: vi.fn(),
        listByProjectId: vi.fn(),
      } as any;

      const useCase = createUseCase({
        invitationRepository,
        consentRequirements,
        consentRepository,
      });

      const result = await useCase.execute({ token: TOKEN });

      expect(result.isSuccess).toBe(true);
      if (result.isSuccess) {
        expect(result.data.consentRequired).toBe(false);
        expect(result.data.alreadyConsented).toBe(false);
      }
    });
  });
});
