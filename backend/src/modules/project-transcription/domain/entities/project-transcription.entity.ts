export interface ProjectTranscriptionProps {
  readonly id: string;
  readonly projectId: string;
  readonly userId: string;
  readonly transcript: string;
  readonly originalFilename: string | null;
  readonly mimeType: string | null;
  readonly sizeBytes: number | null;
  readonly language: string | null;
  readonly createdAt: Date;
}

export class ProjectTranscriptionEntity implements ProjectTranscriptionProps {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly userId: string,
    public readonly transcript: string,
    public readonly originalFilename: string | null,
    public readonly mimeType: string | null,
    public readonly sizeBytes: number | null,
    public readonly language: string | null,
    public readonly createdAt: Date
  ) {}

  static fromRow(row: {
    id: string;
    project_id: string;
    user_id: string;
    transcript: string;
    original_filename: string | null;
    mime_type: string | null;
    size_bytes: number | null;
    language: string | null;
    created_at: string;
  }): ProjectTranscriptionEntity {
    return new ProjectTranscriptionEntity(
      row.id,
      row.project_id,
      row.user_id,
      row.transcript,
      row.original_filename,
      row.mime_type,
      row.size_bytes != null ? Number(row.size_bytes) : null,
      row.language,
      new Date(row.created_at)
    );
  }

  toJson(): Record<string, unknown> {
    return {
      id: this.id,
      projectId: this.projectId,
      userId: this.userId,
      transcript: this.transcript,
      originalFilename: this.originalFilename,
      mimeType: this.mimeType,
      sizeBytes: this.sizeBytes,
      language: this.language,
      createdAt: this.createdAt.toISOString(),
    };
  }
}
