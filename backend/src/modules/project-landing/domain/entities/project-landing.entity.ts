import { randomUUID } from 'crypto';

export interface ProjectLanding {
  readonly id: string;
  readonly projectId: string;
  readonly slug: string;
  readonly archiveFilename: string;
  readonly uploadedAt: Date;
  readonly fileCount: number;
  readonly totalSizeBytes: number;
}

export class ProjectLandingEntity implements ProjectLanding {
  private constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly slug: string,
    public readonly archiveFilename: string,
    public readonly uploadedAt: Date,
    public readonly fileCount: number,
    public readonly totalSizeBytes: number
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

  static create(
    projectId: string,
    slug: string,
    archiveFilename: string,
    fileCount: number,
    totalSizeBytes: number,
    id?: string,
    uploadedAt?: Date
  ): ProjectLandingEntity {
    return new ProjectLandingEntity(
      id || randomUUID(),
      projectId,
      slug,
      archiveFilename,
      uploadedAt || new Date(),
      fileCount,
      totalSizeBytes
    );
  }

  static fromData(data: ProjectLanding): ProjectLandingEntity {
    return new ProjectLandingEntity(
      data.id,
      data.projectId,
      data.slug,
      data.archiveFilename,
      data.uploadedAt,
      data.fileCount,
      data.totalSizeBytes
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
    };
  }
}