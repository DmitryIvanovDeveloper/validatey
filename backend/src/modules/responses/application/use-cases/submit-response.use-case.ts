import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ResponseEntity } from '../../domain/entities/response.entity';
import { InvalidResponseDataError } from '../../domain/errors/response.error';
import { ResponseRepositoryPort } from '../ports/response-repository.port';
import { StorageServicePort } from '../ports/storage-service.port';
import { SubmitResponseUseCaseRequest, SubmitResponseUseCaseResponse } from './input-output/submit-response.io';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { InvitationRepositoryPort } from '../../../invitations/application/ports/invitation-repository.port';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import { ScenarioRepositoryPort } from '../../../scenarios/application/ports/scenario-repository.port';
import { TYPES as SCENARIO_TYPES } from '../../../scenarios/infrastructure/bootstrap/types';
import { ScenarioParserService } from '../../../surveys/domain/services/scenario-parser.service';

@injectable()
export class SubmitResponseUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ResponseRepository)
    private readonly _repository: ResponseRepositoryPort,
    @inject(TYPES.StorageService)
    private readonly _storageService: StorageServicePort,
    @inject(INVITATION_TYPES.InvitationRepository)
    private readonly _invitationRepository: InvitationRepositoryPort,
    @inject(SCENARIO_TYPES.ScenarioRepository)
    private readonly _scenarioRepository: ScenarioRepositoryPort
  ) {}

  async execute(
    request: SubmitResponseUseCaseRequest
  ): Promise<ResultEx<SubmitResponseUseCaseResponse, InvalidResponseDataError>> {
    this._logger.info('submit-response.start', { token: request.invitationToken.substring(0, 10) + '...' });

    try {
      // Get invitation by token
      const invitationResult = await this._invitationRepository.findByToken(request.invitationToken);

      if (!invitationResult.isSuccess) {
        return ResultEx.failure(new InvalidResponseDataError('Invalid invitation token'));
      }

      const invitation = invitationResult.data;

      // Get latest scenario for the project to extract question labels
      const scenariosResult = await this._scenarioRepository.findByProjectId(invitation.projectId);

      let questionLabels: Record<string, string> = {};
      if (scenariosResult.isSuccess && scenariosResult.data && scenariosResult.data.length > 0) {
        // Get the latest scenario (first in array, sorted by version desc)
        const latestScenario = scenariosResult.data[0];
        const questions = ScenarioParserService.parse(latestScenario.content);
        questionLabels = questions.reduce((labels, q) => {
          labels[q.id] = q.text;
          return labels;
        }, {} as Record<string, string>);
      }

      // Upload audio if provided
      let audioUrl: string | null = null;
      if (request.audioFile) {
        const uploadResult = await this._storageService.uploadFile({
          file: request.audioFile.buffer,
          filename: request.audioFile.filename,
          contentType: request.audioFile.contentType,
          folder: `responses/${invitation.projectId}`,
        });

        if (!uploadResult.isSuccess) {
          this._logger.error('submit-response.upload-error', { error: uploadResult.error });
          return ResultEx.failure(new InvalidResponseDataError('Failed to upload audio file'));
        }

        audioUrl = uploadResult.data.url;
      }

      const isAnonymous = invitation.email === null && invitation.phone === null;
      const moderationStatus = isAnonymous ? ('pending' as const) : undefined;

      // Create response entity (public-link responses get moderationStatus 'pending')
      const response = ResponseEntity.create(
        invitation.id,
        invitation.projectId,
        request.answers,
        audioUrl || undefined,
        moderationStatus,
        questionLabels
      );

      // Save response
      const saveResult = await this._repository.create(response.toData());

      if (!saveResult.isSuccess) {
        this._logger.error('submit-response.save-error', { error: saveResult.error });
        return ResultEx.failure(saveResult.error);
      }

      // Mark invitation as completed
      const InvitationEntity = (await import('../../../invitations/domain/entities/invitation.entity')).InvitationEntity;
      const completedInvitation = InvitationEntity.fromData(invitation).markAsCompleted();
      await this._invitationRepository.update(completedInvitation.toData());

      this._logger.info('submit-response.success', { responseId: saveResult.data.id });

      return ResultEx.success({
        response: saveResult.data,
      });
    } catch (error) {
      this._logger.error('submit-response.error', { error });
      if (error instanceof InvalidResponseDataError) {
        return ResultEx.failure(error);
      }
      return ResultEx.failure(new InvalidResponseDataError(error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}



