import ResultEx from '../../../../infrastructure/result/result';
import { AudioProcessingError } from '../../domain/errors/response.error';

export interface GenerateEmbeddingRequest {
  text: string;
}

export interface GenerateEmbeddingResponse {
  embedding: number[];
  dimension: number;
}

export interface EmbeddingServicePort {
  generateEmbedding(request: GenerateEmbeddingRequest): Promise<ResultEx<GenerateEmbeddingResponse, AudioProcessingError>>;
  saveEmbedding(responseId: string, embedding: number[]): Promise<ResultEx<void, Error>>;
}

