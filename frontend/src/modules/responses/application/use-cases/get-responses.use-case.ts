import { inject, injectable } from 'inversify';
import type { ResponseRepositoryPort } from '../ports/response-repository.port';
import { ResponseEntity } from '../../domain/entities/response.entity';
import type { GetResponsesUseCaseRequest, GetResponsesUseCaseResponse } from './input-output/get-responses.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetResponsesUseCase {
  constructor(
    @inject(TYPES.ResponseRepository)
    private readonly _repository: ResponseRepositoryPort
  ) {}

  async execute(request: GetResponsesUseCaseRequest): Promise<GetResponsesUseCaseResponse> {
    const result = await this._repository.getByProjectId(request.projectId, request.options);

    if (result.error) {
      return {
        responses: [],
        total: 0,
        summary: { total: 0, responded: 0, pendingModeration: 0, averageWordCount: 0 },
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
      questionLabels: entity.questionLabels,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      wordCount: this.calculateWordCount(entity),
      hasAudio: !!entity.audioUrl,
      hasTranscript: !!entity.transcript,
    }));

    const summary = this.calculateSummary(responses);

    return {
      responses,
      total: result.total,
      summary,
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

  private calculateSummary(responses: GetResponsesUseCaseResponse['responses']): GetResponsesUseCaseResponse['summary'] {
    const total = responses.length;
    const responded = responses.filter(r => r.moderationStatus !== 'pending' || r.moderationStatus === null).length;
    const pendingModeration = responses.filter(r => r.moderationStatus === 'pending').length;
    const totalWordCount = responses.reduce((sum, r) => sum + (r.wordCount || 0), 0);
    const averageWordCount = total > 0 ? Math.round(totalWordCount / total) : 0;

    return {
      total,
      responded,
      pendingModeration,
      averageWordCount,
    };
  }
}