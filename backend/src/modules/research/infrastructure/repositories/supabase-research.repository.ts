import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { ResearchDataRepositoryPort } from '../../application/ports/research-data-repository.port';
import type { StoredResearchData, MarketDataBlock, CompetitorInfoBlock, SynthesisReport, AutocompleteInsights, UserInsightsBlock, AssumptionAssessment } from '../../domain/value-objects';
import type { ResearchStatus } from '../../domain/value-objects/research-status.vo';
import type { CommentPatternAnalysis } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';

@injectable()
export class SupabaseResearchRepository implements ResearchDataRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async findByProjectId(projectId: string): Promise<ResultEx<StoredResearchData | null, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('research_data')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) {
        this._logger.error('supabase-research-repository.find-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      if (!data) return ResultEx.success(null);

      // Parse comment_pattern_analysis with proper date conversion
      let commentPatternAnalysis: CommentPatternAnalysis | null = null;
      if (data.comment_pattern_analysis) {
        const raw = data.comment_pattern_analysis as any;
        commentPatternAnalysis = {
          ...raw,
          analyzedAt: raw.analyzedAt ? new Date(raw.analyzedAt) : new Date(),
        } as CommentPatternAnalysis;
      }

      const stored: StoredResearchData = {
        projectId: data.project_id,
        marketData: (data.market_data as MarketDataBlock) ?? null,
        competitorData: (data.competitor_data as CompetitorInfoBlock) ?? null,
        userInsights: (data.user_insights as UserInsightsBlock) ?? null,
        autocompleteInsights: (data.autocomplete_insights as AutocompleteInsights) ?? null,
        synthesisReport: (data.synthesis_report as SynthesisReport) ?? null,
        assumptionAssessments: (data.assumption_assessments as AssumptionAssessment[] | null) ?? null,
        commentPatternAnalysis,
        lastResearchRunAt: data.last_research_run_at ? new Date(data.last_research_run_at) : null,
        updatedAt: new Date(data.updated_at),
        researchStatus: (data.research_status as ResearchStatus) ?? 'idle',
        researchStatusUpdatedAt: data.research_status_updated_at ? new Date(data.research_status_updated_at) : null,
      };
      return ResultEx.success(stored);
    } catch (error) {
      this._logger.error('supabase-research-repository.find-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async save(data: StoredResearchData): Promise<ResultEx<void, Error>> {
    try {
      const supabase = getSupabaseClient();
      // Convert CommentPatternAnalysis to JSON (with date serialization)
      const commentPatternAnalysisJson = data.commentPatternAnalysis
        ? {
            ...data.commentPatternAnalysis,
            analyzedAt: data.commentPatternAnalysis.analyzedAt.toISOString(),
          }
        : null;

      const nowIso = new Date().toISOString();
      const { error } = await supabase.from('research_data').upsert(
        {
          project_id: data.projectId,
          market_data: data.marketData,
          competitor_data: data.competitorData,
          autocomplete_insights: data.autocompleteInsights,
          synthesis_report: data.synthesisReport,
          assumption_assessments: data.assumptionAssessments ?? null,
          comment_pattern_analysis: commentPatternAnalysisJson,
          last_research_run_at: data.lastResearchRunAt?.toISOString(),
          updated_at: nowIso,
          research_status: data.researchStatus ?? 'idle',
          research_status_updated_at: data.researchStatusUpdatedAt?.toISOString() ?? nowIso,
        },
        { onConflict: 'project_id' }
      );

      if (error) {
        this._logger.error('supabase-research-repository.save-error', { projectId: data.projectId, error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-research-repository.save-exception', { projectId: data.projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async updateResearchStatus(projectId: string, status: ResearchStatus): Promise<ResultEx<void, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('research_data')
        .update({
          research_status: status,
          research_status_updated_at: new Date().toISOString(),
        })
        .eq('project_id', projectId);

      if (error) {
        this._logger.error('supabase-research-repository.update-status-error', { projectId, status, error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-research-repository.update-status-exception', { projectId, status, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
