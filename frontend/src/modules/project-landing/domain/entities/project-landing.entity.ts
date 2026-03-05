export interface ProjectLanding {
  readonly id: string;
  readonly projectId: string;
  readonly slug: string;
  readonly archiveFilename: string;
  readonly uploadedAt: string;
  readonly fileCount: number;
  readonly totalSizeBytes: number;
  readonly url: string;
}

export class ProjectLandingEntity implements ProjectLanding {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly slug: string,
    public readonly archiveFilename: string,
    public readonly uploadedAt: string,
    public readonly fileCount: number,
    public readonly totalSizeBytes: number,
    public readonly url: string
  ) {
    if (!id || id.trim().length === 0) {
      throw new Error('Landing id cannot be empty');
    }
    if (!projectId || projectId.trim().length === 0) {
      throw new Error('Project id cannot be empty');
    }
    if (!slug || slug.trim().length === 0) {
      throw new Error('Landing slug cannot be empty');
    }
    if (fileCount < 0) {
      throw new Error('File count cannot be negative');
    }
    if (totalSizeBytes < 0) {
      throw new Error('Total size cannot be negative');
    }
  }

  static fromApiResponse(data: any): ProjectLandingEntity {
    return new ProjectLandingEntity(
      data.id,
      data.projectId,
      data.slug,
      data.archiveFilename,
      data.uploadedAt,
      data.fileCount,
      data.totalSizeBytes,
      data.url
    );
  }

  toData(): ProjectLanding {
    return {
      id: this.id,
      projectId: this.projectId,
      slug: this.slug,
      archiveFilename: this.archiveFilename,
      uploadedAt: this.uploadedAt,
      fileCount: this.fileCount,
      totalSizeBytes: this.totalSizeBytes,
      url: this.url,
    };
  }

  // Business methods
  getFormattedSize(): string {
    const sizeInMB = this.totalSizeBytes / (1024 * 1024);
    return `${sizeInMB.toFixed(2)} MB`;
  }

  getUploadedAtFormatted(): string {
    return new Date(this.uploadedAt).toLocaleDateString();
  }
}