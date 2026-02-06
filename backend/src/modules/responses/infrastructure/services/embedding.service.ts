import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';
import { EmbeddingServicePort, GenerateEmbeddingRequest, GenerateEmbeddingResponse } from '../../application/ports/embedding-service.port';
import { AudioProcessingError } from '../../domain/errors/response.error';

@injectable()
export class EmbeddingService implements EmbeddingServicePort {
  private readonly llmServiceUrl: string;

  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROOT_TYPES.HttpClient)
    private readonly _httpClient: HttpClientPort
  ) {
    this.llmServiceUrl = process.env.LLM_SERVICE_URL || 'http://localhost:8080';
  }

  async generateEmbedding(
    request: GenerateEmbeddingRequest
  ): Promise<ResultEx<GenerateEmbeddingResponse, AudioProcessingError>> {
    this._logger.info('embedding-service.generate-embedding.start', { textLength: request.text.length });

    try {
      // TODO: Call LLM service for embeddings
      // For now, return placeholder
      this._logger.warn('embedding-service.generate-embedding.not-implemented');

      return ResultEx.failure(new AudioProcessingError('Embedding service not implemented yet'));
    } catch (error) {
      this._logger.error('embedding-service.generate-embedding.error', { error });
      return ResultEx.failure(
        new AudioProcessingError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async saveEmbedding(responseId: string, embedding: number[]): Promise<ResultEx<void, Error>> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.from('response_embeddings').insert({
        response_id: responseId,
        embedding: `[${embedding.join(',')}]`, // Convert to pgvector format
      });

      if (error) {
        this._logger.error('embedding-service.save-embedding.error', { error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('embedding-service.save-embedding.exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}



