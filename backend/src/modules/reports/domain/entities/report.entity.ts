export interface Report {
  readonly id: string;
  readonly projectId: string;
  readonly version: number;
  readonly metrics: Record<string, any> | null;
  readonly htmlContent: string | null;
  readonly pdfUrl: string | null;
  readonly token: string;
  readonly generatedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class ReportEntity {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly version: number,
    public readonly metrics: Record<string, any> | null,
    public readonly htmlContent: string | null,
    public readonly pdfUrl: string | null,
    public readonly token: string,
    public readonly generatedAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static create(
    projectId: string,
    version: number,
    metrics: Record<string, any>,
    token: string
  ): ReportEntity {
    const now = new Date();
    return new ReportEntity(
      this.generateId(),
      projectId,
      version,
      metrics,
      null,
      null,
      token,
      now,
      now,
      now
    );
  }

  static fromData(data: Report): ReportEntity {
    return new ReportEntity(
      data.id,
      data.projectId,
      data.version,
      data.metrics,
      data.htmlContent,
      data.pdfUrl,
      data.token,
      data.generatedAt,
      data.createdAt,
      data.updatedAt
    );
  }

  withHtmlContent(htmlContent: string): ReportEntity {
    return new ReportEntity(
      this.id,
      this.projectId,
      this.version,
      this.metrics,
      htmlContent,
      this.pdfUrl,
      this.token,
      this.generatedAt,
      this.createdAt,
      new Date()
    );
  }

  withPdfUrl(pdfUrl: string): ReportEntity {
    return new ReportEntity(
      this.id,
      this.projectId,
      this.version,
      this.metrics,
      this.htmlContent,
      pdfUrl,
      this.token,
      this.generatedAt,
      this.createdAt,
      new Date()
    );
  }

  toData(): Report {
    return {
      id: this.id,
      projectId: this.projectId,
      version: this.version,
      metrics: this.metrics,
      htmlContent: this.htmlContent,
      pdfUrl: this.pdfUrl,
      token: this.token,
      generatedAt: this.generatedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  private static generateId(): string {
    return `rpt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

