import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ResponseRepositoryPort } from '../ports/response-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GetResponsesByProjectIdUseCaseRequest, GetResponsesByProjectIdUseCaseResponse } from './input-output/get-responses-by-project-id.io';

@injectable()
export class GetResponsesByProjectIdUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ResponseRepository)
    private readonly _responseRepository: ResponseRepositoryPort
  ) {}

  async execute(
    request: GetResponsesByProjectIdUseCaseRequest
  ): Promise<ResultEx<GetResponsesByProjectIdUseCaseResponse, Error>> {
    this._logger.info('get-responses-by-project-id.start', { projectId: request.projectId });

    try {
      const result = await this._responseRepository.findByProjectId(request.projectId);

      if (!result.isSuccess) {
        this._logger.error('get-responses-by-project-id.error', {
          projectId: request.projectId,
          error: result.error,
        });
        return ResultEx.failure(result.error);
      }

      const responses = result.data.map(res => ({
        id: res.id,
        invitationId: res.invitationId,
        projectId: res.projectId,
        answers: res.answers,
        audioUrl: res.audioUrl,
        transcript: res.transcript,
        createdAt: res.createdAt,
        updatedAt: res.updatedAt,
      }));

      this._logger.info('get-responses-by-project-id.success', {
        projectId: request.projectId,
        count: responses.length,
      });

      return ResultEx.success({ responses });
    } catch (error) {
      this._logger.error('get-responses-by-project-id.exception', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
