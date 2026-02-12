import { injectable, inject } from 'inversify';
import type { ResearchRepositoryPort } from '../../application/ports/research-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import type { ResearchCanvas, SynthesisReport } from '../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { ResearchNotFoundError, ResearchCollectError, ResearchSynthesisError } from '../../domain/errors/research.error';

@injectable()
export class ResearchRepository implements ResearchRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async getResearchCanvas(projectId: string): Promise<ResearchCanvas> {
    try {
      const response = await this._httpClient.get<ResearchCanvas>(
        API_CONFIG.ENDPOINTS.RESEARCH_CANVAS(projectId)
      );
      return response;
    } catch (error) {
      throw new ResearchNotFoundError(projectId);
    }
  }

  async collectResearchData(projectId: string, intent: ResearchIntent): Promise<{
    collected: boolean;
    marketDataCollected: boolean;
    competitorDataCollected: boolean;
    autocompleteDataCollected: boolean;
  }> {
    try {
      const response = await this._httpClient.post<{
        collected: boolean;
        marketDataCollected: boolean;
        competitorDataCollected: boolean;
        autocompleteDataCollected: boolean;
      }>(
        API_CONFIG.ENDPOINTS.RESEARCH_COLLECT(projectId),
        intent
      );
      return response;
    } catch (error) {
      throw new ResearchCollectError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async generateSynthesis(projectId: string): Promise<SynthesisReport> {
    try {
      const response = await this._httpClient.post<SynthesisReport>(
        API_CONFIG.ENDPOINTS.RESEARCH_SYNTHESIS(projectId),
        {}
      );
      return response;
    } catch (error) {
      throw new ResearchSynthesisError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async askAssistant(
    projectId: string,
    question: string
  ): Promise<{
    reply: string;
    suggestedMethods?: string[];
    clarificationQuestions?: string[];
  }> {
    try {
      const response = await this._httpClient.post<{
        reply: string;
        suggestedMethods?: string[];
        clarificationQuestions?: string[];
      }>(
        API_CONFIG.ENDPOINTS.RESEARCH_ASSISTANT(projectId),
        { question }
      );
      return response;
    } catch (error) {
      // Fallback response if API fails
      return {
        reply: 'I apologize, but I\'m unable to provide assistance at the moment. Please try again later.',
      };
    }
  }
}