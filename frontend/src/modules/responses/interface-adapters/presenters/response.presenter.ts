import { inject, injectable } from 'inversify';
import { GetResponsesUseCase } from '../../application/use-cases/get-responses.use-case';
import { ExportResponsesUseCase } from '../../application/use-cases/export-responses.use-case';
import { ModerateResponseUseCase } from '../../application/use-cases/moderate-response.use-case';
import { ListResponsesForModerationUseCase } from '../../application/use-cases/list-responses-for-moderation.use-case';
import type { GetResponsesOptions } from '../../application/ports/response-repository.port';
import type { ResponseEntity, ModerationStatus } from '../../domain/entities/response.entity';

export interface ResponseListItem {
  id: string;
  invitationId: string;
  projectId: string;
  answers: Record<string, any>;
  audioUrl: string | null;
  transcript: string | null;
  moderationStatus: ModerationStatus | null;
  createdAt: Date;
  updatedAt: Date;
  // Additional computed properties for UI
  wordCount?: number;
  hasAudio?: boolean;
  hasTranscript?: boolean;
}

export interface ResponseSummary {
  total: number;
  responded: number;
  pendingModeration: number;
  averageWordCount: number;
}

@injectable()
export class ResponsePresenter {
  constructor(
    @inject(GetResponsesUseCase)
    private readonly _getResponsesUseCase: GetResponsesUseCase,
    @inject(ExportResponsesUseCase)
    private readonly _exportResponsesUseCase: ExportResponsesUseCase,
    @inject(ModerateResponseUseCase)
    private readonly _moderateResponseUseCase: ModerateResponseUseCase,
    @inject(ListResponsesForModerationUseCase)
    private readonly _listResponsesForModerationUseCase: ListResponsesForModerationUseCase
  ) {}

  async getResponses(projectId: string, options?: GetResponsesOptions): Promise<{
    responses: ResponseListItem[];
    total: number;
    summary: ResponseSummary;
    error?: string;
  }> {
    const result = await this._getResponsesUseCase.execute({ projectId, options });

    return result;
  }

  async exportResponses(projectId: string, format: 'json' | 'csv'): Promise<{ data: Blob; error?: string }> {
    return await this._exportResponsesUseCase.execute({ projectId, format });
  }

  async moderateResponse(responseId: string, status: ModerationStatus): Promise<{ success: boolean; error?: string }> {
    const result = await this._moderateResponseUseCase.execute({ responseId, status });
    return result;
  }

  async getResponsesForModeration(projectId: string): Promise<{
    responses: ResponseListItem[];
    error?: string;
  }> {
    const result = await this._listResponsesForModerationUseCase.execute({ projectId });

    return result;
  }

}