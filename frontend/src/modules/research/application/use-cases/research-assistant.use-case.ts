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
    return this._researchRepository.askAssistant(request.projectId, request.question);
  }
}