export interface GenerateLandingUseCaseRequest {
  projectId: string;
  userId: string;
  customPrompt?: string;
}

export interface GenerateLandingUseCaseResponse {
  landing: {
    id: string;
    projectId: string;
    slug: string;
    archiveFilename: string;
    uploadedAt: string;
    fileCount: number;
    totalSizeBytes: number;
    url: string;
  };
}