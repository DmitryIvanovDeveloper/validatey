import { injectable, inject } from 'inversify';
import type { ResearchRepositoryPort } from '../../application/ports/research-repository.port';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import type { ResearchCanvas, SynthesisReport } from '../../domain/entities/research-canvas.entity';
import type { ResearchIntent } from '../../domain/value-objects/research-intent.vo';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { ResearchNotFoundError, ResearchCollectError, ResearchSynthesisError, ResearchCooldownError, type CooldownErrorDetails } from '../../domain/errors/research.error';

interface CollectResearchDataResponse {
  collected: boolean;
  marketDataCollected: boolean;
  competitorDataCollected: boolean;
  autocompleteDataCollected: boolean;
  canvas?: any; // For compatibility with existing frontend code
}

interface ApiCooldownError {
  status: number;
  response?: {
    data?: CooldownErrorDetails;
  };
}

@injectable()
export class ResearchRepository implements ResearchRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {}

  async getResearchCanvas(projectId: string): Promise<{
    canvas: ResearchCanvas;
    synthesisReport?: SynthesisReport | null;
    projectName?: string;
    projectHypothesis?: string;
    recommendedTemplate?: {
      name: string;
      slug: string;
      description: string;
    };
    assumptionStatuses?: ('confirmed' | 'need_more' | 'not_supported')[] | null;
    assumptionAssessments?: Array<{ assumptionId: string; status: string; evidence: string | null }> | null;
  }> {
    try {
      const response = await this._httpClient.get<{
        canvas: ResearchCanvas;
        synthesisReport?: SynthesisReport | null;
        projectName?: string;
        projectHypothesis?: string;
        recommendedTemplate?: {
          name: string;
          slug: string;
          description: string;
        };
        assumptionStatuses?: ('confirmed' | 'need_more' | 'not_supported')[] | null;
        assumptionAssessments?: Array<{ assumptionId: string; status: string; evidence: string | null }> | null;
      }>(
        API_CONFIG.ENDPOINTS.RESEARCH_CANVAS(projectId)
      );
      return response;
    } catch (error) {
      throw new ResearchNotFoundError(projectId);
    }
  }

  async collectResearchData(projectId: string, intent: ResearchIntent): Promise<CollectResearchDataResponse> {
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
      return {
        ...response,
        canvas: {} // Empty canvas for compatibility
      };
    } catch (error: unknown) {
      // Check if it's a cooldown error
      if (error && typeof error === 'object' && 'status' in error && 'response' in error) {
        const apiError = error as ApiCooldownError;
        if (apiError.status === 429 && apiError.response?.data) {
          const cooldownData = apiError.response.data;
          throw new ResearchCooldownError(
            cooldownData.nextAvailableAt,
            cooldownData.timeUntilNext,
            cooldownData.formattedTimeRemaining
          );
        }
      }
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

  async checkResearchAvailability(projectId: string): Promise<{
    available: boolean;
    nextAvailableAt: Date | null;
    timeUntilNext: number;
    formattedTimeRemaining?: string;
  }> {
    try {
      const response = await this._httpClient.get<{
        available: boolean;
        nextAvailableAt: string | null;
        timeUntilNext: number;
        formattedTimeRemaining?: string;
      }>(
        API_CONFIG.ENDPOINTS.RESEARCH_AVAILABILITY(projectId)
      );
      return {
        available: response.available,
        nextAvailableAt: response.nextAvailableAt ? new Date(response.nextAvailableAt) : null,
        timeUntilNext: response.timeUntilNext,
        formattedTimeRemaining: response.formattedTimeRemaining,
      };
    } catch (error: unknown) {
      throw new ResearchCollectError(error instanceof Error ? error.message : 'Unknown error');
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