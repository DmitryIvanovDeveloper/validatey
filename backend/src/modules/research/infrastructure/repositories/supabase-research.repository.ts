import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { ResearchDataRepositoryPort } from '../../application/ports/research-data-repository.port';
import type { StoredResearchData, MarketDataBlock, CompetitorInfoBlock, SynthesisReport } from '../../domain/entities';

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

      const stored: StoredResearchData = {
        projectId: data.project_id,
        marketData: (data.market_data as MarketDataBlock) ?? null,
        competitorData: (data.competitor_data as CompetitorInfoBlock) ?? null,
        synthesisReport: (data.synthesis_report as SynthesisReport) ?? null,
        updatedAt: new Date(data.updated_at),
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
      const { error } = await supabase.from('research_data').upsert(
        {
          project_id: data.projectId,
          market_data: data.marketData,
          competitor_data: data.competitorData,
          synthesis_report: data.synthesisReport,
          updated_at: new Date().toISOString(),
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
}
