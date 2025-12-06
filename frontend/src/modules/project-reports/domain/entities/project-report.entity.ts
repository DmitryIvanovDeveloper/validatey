export type Verdict = 'validated' | 'rejected' | 'needs-more-data';

export interface ReportMetrics {
  totalResponses: number;
  completionRate: number;
  averageRating?: number;
}

export interface Cluster {
  id: string;
  name: string;
  size: number;
  characteristics: Record<string, any>;
}

export interface Alternative {
  id: string;
  name: string;
  score: number;
}

export interface WTPData {
  min: number;
  max: number;
  average: number;
}

export class ProjectReport {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly verdict: Verdict,
    public readonly metrics: ReportMetrics,
    public readonly clusters: Cluster[],
    public readonly alternatives: Alternative[],
    public readonly wtp: WTPData | null,
    public readonly recommendations: string[]
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('ProjectReport id cannot be empty');
    }
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('ProjectReport projectId cannot be empty');
    }
  }

  withMetrics(metrics: ReportMetrics): ProjectReport {
    return new ProjectReport(
      this.id,
      this.projectId,
      this.verdict,
      metrics,
      this.clusters,
      this.alternatives,
      this.wtp,
      this.recommendations
    );
  }

  exportHtml(): string {
    // TODO: Implement HTML export
    return '';
  }

  exportPdf(): Blob {
    // TODO: Implement PDF export
    return new Blob();
  }
}

