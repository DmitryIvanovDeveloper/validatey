import { inject, injectable } from 'inversify';
import { GetResponsesUseCase } from '../../application/use-cases/get-responses.use-case';
import { ExportResponsesUseCase } from '../../application/use-cases/export-responses.use-case';
import { ModerateResponseUseCase } from '../../application/use-cases/moderate-response.use-case';
import { ListResponsesForModerationUseCase } from '../../application/use-cases/list-responses-for-moderation.use-case';
import { GetProjectMetadataUseCase } from '../../application/use-cases/get-project-metadata.use-case';
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
  questionLabels: Record<string, string>;
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

export interface ResponsePaceData {
  currentPace: number; // responses per day (7-day average)
  totalResponses: number; // all-time count (for progress when currentPace is 0)
  yesterdayResponses: number;
  lastWeekAvg: number; // same as currentPace, kept for backward compatibility
  thisWeekTotal: number;
  insights: Array<{
    id: string;
    message: string;
  }>;
}

export interface AiVerdictData {
  verdict: string; // The AI verdict text
  type: 'positive' | 'negative' | 'neutral'; // For styling purposes
  label: string; // The display label (GO, NO-GO, ANALYSIS, etc.)
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
    private readonly _listResponsesForModerationUseCase: ListResponsesForModerationUseCase,
    @inject(GetProjectMetadataUseCase)
    private readonly _getProjectMetadataUseCase: GetProjectMetadataUseCase
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

  async getResponsePace(projectId: string, targetPace: number = 5): Promise<{
    data: ResponsePaceData;
    error?: string;
  }> {
    try {
      // Get all responses for the project
      const result = await this._getResponsesUseCase.execute({ projectId });
      if (result.error) {
        return { data: this._getEmptyPaceData(targetPace), error: result.error };
      }

      const responses = result.responses;
      const now = new Date();

      // Calculate current pace (responses per day over last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentResponses = responses.filter(response =>
        new Date(response.createdAt) >= sevenDaysAgo
      );
      const currentPace = Math.round((recentResponses.length / 7) * 10) / 10;

      // Calculate yesterday's responses
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();
      const yesterdayResponses = responses.filter(response =>
        new Date(response.createdAt).toDateString() === yesterdayStr
      ).length;

      // Calculate this week's total responses (from Sunday to now)
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const thisWeekTotal = responses.filter(response =>
        new Date(response.createdAt) >= weekStart
      ).length;

      // Generate insights
      const insights = this._generatePaceInsights(responses, currentPace, targetPace);

      return {
        data: {
          currentPace,
          totalResponses: responses.length,
          yesterdayResponses,
          lastWeekAvg: currentPace,
          thisWeekTotal,
          insights
        }
      };
    } catch (error) {
      return {
        data: this._getEmptyPaceData(targetPace),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private _getEmptyPaceData(targetPace: number): ResponsePaceData {
    return {
      currentPace: 0,
      totalResponses: 0,
      yesterdayResponses: 0,
      lastWeekAvg: 0,
      thisWeekTotal: 0,
      insights: []
    };
  }

  private _generatePaceInsights(responses: ResponseListItem[], currentPace: number, targetPace: number): Array<{ id: string; message: string }> {
    const insights = [];

    if (currentPace < targetPace * 0.5) {
      insights.push({
        id: 'low-pace',
        message: 'Response pace is below 50% of target. Consider sending reminders or extending the survey period.'
      });
    } else if (currentPace === 0 && responses.length === 0) {
      insights.push({
        id: 'no-responses',
        message: 'No responses received yet. Check if survey link is working or send initial invitations.'
      });
    }

    // Check for recent activity
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const recentResponses = responses.filter(response =>
      new Date(response.createdAt) >= threeDaysAgo
    );

    if (responses.length > 0 && recentResponses.length === 0) {
      insights.push({
        id: 'no-recent-activity',
        message: 'No responses received in the last 3 days. Consider follow-up reminders.'
      });
    }

    return insights;
  }

  async getAiVerdict(projectId: string, options: {
    sentInvitations: number;
    projectDeadline?: Date;
  }): Promise<{
    data: AiVerdictData;
    error?: string;
  }> {
    try {
      // Get project metadata first
      const metadataResult = await this._getProjectMetadataUseCase.execute({ projectId });
      if (!metadataResult.isSuccess) {
        return { data: this._getDefaultVerdict(), error: metadataResult.error.message };
      }

      // Get responses for analysis
      const responsesResult = await this._getResponsesUseCase.execute({ projectId });
      if (responsesResult.error) {
        return { data: this._getDefaultVerdict(), error: responsesResult.error };
      }

      const responses = responsesResult.responses;
      const responded = responses.length;
      const sent = options.sentInvitations;
      const responseRatePct = sent > 0 ? Math.round((responded / sent) * 100) : 0;

      // Calculate pace
      const pace = this._calculatePace(responses);

      // Use significance target from project metadata
      const significanceTarget = metadataResult.data.significanceTarget;
      const neededForSignificance = significanceTarget !== null && responded < significanceTarget
        ? Math.max(0, significanceTarget - responded)
        : null;

      // Use deadline from options or metadata
      const daysRemaining = this._calculateDaysRemaining(options.projectDeadline || metadataResult.data.deadline);

      // Generate verdict text
      const verdict = this._buildAiVerdict(responded, responseRatePct, neededForSignificance, daysRemaining, pace);

      // Determine verdict type and label for styling
      const type = this._getVerdictType(verdict);
      const label = this._getVerdictLabel(verdict);

      return {
        data: {
          verdict,
          type,
          label
        }
      };
    } catch (error) {
      return {
        data: this._getDefaultVerdict(),
        error: error instanceof Error ? error.message : 'Failed to generate AI verdict'
      };
    }
  }

  private _getDefaultVerdict(): AiVerdictData {
    return {
      verdict: 'Keep collecting responses and check Early Signals on the Report.',
      type: 'neutral',
      label: 'ANALYSIS'
    };
  }

  private _calculatePace(responses: ResponseListItem[]): number {
    if (responses.length === 0) return 0;

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentResponses = responses.filter(response =>
      new Date(response.createdAt) >= sevenDaysAgo
    );

    return Math.round((recentResponses.length / 7) * 10) / 10;
  }

  private _calculateDaysRemaining(deadline?: Date): number | null {
    if (!deadline) return null;

    const now = Date.now();
    const end = deadline.getTime();
    return Math.max(0, Math.ceil((end - now) / (24 * 60 * 60 * 1000)));
  }

  private _buildAiVerdict(
    responded: number,
    responseRatePct: number,
    needed: number | null,
    daysRemaining: number | null,
    pace: number
  ): string {
    const parts: string[] = [];

    if (responded === 0) {
      return 'Send invitations to start collecting responses and get an AI verdict.';
    }

    // Show specific count only if we know the target and it's reasonable
    if (needed !== null && needed > 0 && needed <= 200) {
      parts.push(`Need ${needed} more responses for statistical significance.`);
    } else if (responded > 0 && responded < 30) {
      // Fallback when target is unknown but we have some responses
      parts.push('Continue collecting responses to build statistical significance.');
    }

    if (responseRatePct < 20) {
      parts.push('Consider sending reminders or increasing incentive to improve response rate.');
    }

    if (daysRemaining !== null && pace > 0 && needed !== null && needed > 0 && needed <= 100) {
      const atPace = Math.ceil(needed / pace);
      if (atPace > daysRemaining) {
        parts.push(`At current pace, extend deadline or accelerate collection.`);
      }
    }

    // More nuanced success messages based on actual response count
    if (parts.length === 0) {
      if (responded >= 50) {
        return 'Hypothesis looks promising with enough data. Review Report for full insights.';
      } else if (responded >= 20) {
        return 'Good progress on responses. Keep collecting for more insights.';
      } else {
        return 'Keep collecting responses and check Early Signals on the Report.';
      }
    }

    return parts.length > 0 ? parts.join(' ') : 'Keep collecting responses and check Early Signals on the Report.';
  }

  private _getVerdictType(verdict: string): 'positive' | 'negative' | 'neutral' {
    if (verdict.toLowerCase().includes('go') ||
        verdict.toLowerCase().includes('positive') ||
        verdict.toLowerCase().includes('validated') ||
        verdict.toLowerCase().includes('confirmed') ||
        verdict.toLowerCase().includes('promising')) {
      return 'positive';
    } else if (verdict.toLowerCase().includes('no-go') ||
               verdict.toLowerCase().includes('negative')) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  private _getVerdictLabel(verdict: string): string {
    if (verdict.toLowerCase().includes('go')) return 'GO';
    if (verdict.toLowerCase().includes('no-go')) return 'NO-GO';
    if (verdict.toLowerCase().includes('unclear')) return 'UNCLEAR';

    // For other cases, determine based on content
    if (verdict.toLowerCase().includes('need') && verdict.toLowerCase().includes('more')) {
      return 'COLLECTING';
    }
    if (verdict.toLowerCase().includes('continue') || verdict.toLowerCase().includes('keep')) {
      return 'PROGRESS';
    }
    if (verdict.toLowerCase().includes('promising') || verdict.toLowerCase().includes('good')) {
      return 'PROMISING';
    }
    if (verdict.toLowerCase().includes('consider') || verdict.toLowerCase().includes('reminders')) {
      return 'ACTION NEEDED';
    }

    return 'ANALYSIS';
  }

}