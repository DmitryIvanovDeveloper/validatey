import { inject, injectable } from 'inversify';
import type { ResponseRepositoryPort } from '../ports/response-repository.port';
import { ResponseEntity } from '../../domain/entities/response.entity';
import type { ListResponsesForModerationUseCaseRequest, ListResponsesForModerationUseCaseResponse } from './input-output/list-responses-for-moderation.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ListResponsesForModerationUseCase {
  constructor(
    @inject(TYPES.ResponseRepository)
    private readonly _repository: ResponseRepositoryPort
  ) {}

  async execute(request: ListResponsesForModerationUseCaseRequest): Promise<ListResponsesForModerationUseCaseResponse> {
    const result = await this._repository.getPendingForModeration(request.projectId);

    if (result.error) {
      return {
        responses: [],
        error: result.error,
      };
    }

    const responseEntities = result.responses.map(response => ResponseEntity.fromData(response));
    const responses = responseEntities.map(entity => ({
      id: entity.id,
      invitationId: entity.invitationId,
      projectId: entity.projectId,
      answers: entity.answers,
      audioUrl: entity.audioUrl,
      transcript: entity.transcript,
      moderationStatus: entity.moderationStatus,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      wordCount: this.calculateWordCount(entity),
      hasAudio: !!entity.audioUrl,
      hasTranscript: !!entity.transcript,
    }));

    return {
      responses,
    };
  }

  private calculateWordCount(response: ResponseEntity): number {
    let words = 0;

    // Count words in answers
    Object.values(response.answers || {}).forEach((value: any) => {
      const text = typeof value === 'string' ? value :
                   typeof value === 'object' && value && 'text' in value ? String((value as { text: string }).text) :
                   JSON.stringify(value);
      words += text.trim().split(/\s+/).filter(Boolean).length;
    });

    // Count words in transcript
    if (response.transcript) {
      words += response.transcript.trim().split(/\s+/).filter(Boolean).length;
    }

    return words;
  }
}