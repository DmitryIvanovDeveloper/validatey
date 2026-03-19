export interface ProjectTranscriptionData {
  id: string;
  projectId: string;
  userId: string;
  transcript: string;
  originalFilename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  language: string | null;
  createdAt: string;
}

export class ProjectTranscriptionEntity {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public readonly userId: string,
    public readonly transcript: string,
    public readonly originalFilename: string | null,
    public readonly mimeType: string | null,
    public readonly sizeBytes: number | null,
    public readonly language: string | null,
    public readonly createdAt: string
  ) {}

  static fromApi(raw: Record<string, unknown>): ProjectTranscriptionEntity {
    return new ProjectTranscriptionEntity(
      String(raw.id ?? ''),
      String(raw.projectId ?? ''),
      String(raw.userId ?? ''),
      String(raw.transcript ?? ''),
      raw.originalFilename != null ? String(raw.originalFilename) : null,
      raw.mimeType != null ? String(raw.mimeType) : null,
      raw.sizeBytes != null ? Number(raw.sizeBytes) : null,
      raw.language != null ? String(raw.language) : null,
      String(raw.createdAt ?? '')
    );
  }

  preview(maxLen = 120): string {
    const t = this.transcript.trim();
    if (t.length <= maxLen) return t;
    return `${t.slice(0, maxLen)}…`;
  }
}

export interface TranscribeApiResponse {
  id: string;
  transcript: string;
  createdAt: string;
  language?: string;
  originalFilename?: string;
}

export interface TranscriptionInsightsData {
  summary: string;
  insights: string[];
  themes: string[];
  risks: string[];
  nextActions: string[];
  generatedAt: string;
}
