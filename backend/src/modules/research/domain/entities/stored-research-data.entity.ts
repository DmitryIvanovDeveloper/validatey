import type { MarketDataBlock } from './market-data-block.entity';
import type { CompetitorInfoBlock } from './competitor-info-block.entity';
import type { SynthesisReport } from './synthesis-report.entity';

/** Data persisted by ResearchDataRepository (market + competitor + optional synthesis). */
export interface StoredResearchData {
  readonly projectId: string;
  readonly marketData: MarketDataBlock | null;
  readonly competitorData: CompetitorInfoBlock | null;
  readonly synthesisReport: SynthesisReport | null;
  readonly updatedAt: Date;
}
