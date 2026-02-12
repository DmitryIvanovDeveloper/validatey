import { inject, injectable } from 'inversify';
import type { ResponseRepositoryPort } from '../ports/response-repository.port';
import type { ModerateResponseUseCaseRequest, ModerateResponseUseCaseResponse } from './input-output/moderate-response.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ModerateResponseUseCase {
  constructor(
    @inject(TYPES.ResponseRepository)
    private readonly _repository: ResponseRepositoryPort
  ) {}

  async execute(request: ModerateResponseUseCaseRequest): Promise<ModerateResponseUseCaseResponse> {
    if (request.status !== 'approved' && request.status !== 'rejected') {
      return {
        success: false,
        error: 'Invalid moderation status. Must be "approved" or "rejected".',
      };
    }

    return await this._repository.moderate(request.responseId, request.status);
  }
}