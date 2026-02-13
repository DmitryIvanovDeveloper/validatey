import { inject, injectable } from 'inversify';
import type { ResearchRepositoryPort } from '../ports/research-repository.port';
import type {
  ResearchAssistantRequest,
  ResearchAssistantResponse,
} from './input-output/research-assistant.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ResearchAssistantUseCase {
  constructor(
    @inject(TYPES.ResearchRepositoryPort)
    private readonly _researchRepository: ResearchRepositoryPort
  ) {}

  async execute(request: ResearchAssistantRequest): Promise<ResearchAssistantResponse> {
    try {
      return await this._researchRepository.askAssistant(request.projectId, request.question);
    } catch (error) {
      return {
        reply: 'I apologize, but I\'m unable to provide assistance at the moment.',
        error: error instanceof Error ? error.message : 'Failed to get assistant response',
      };
    }
  }
}