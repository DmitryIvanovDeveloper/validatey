export interface GetProjectLandingUseCaseRequest {
  projectId: string;
}

export interface GetProjectLandingUseCaseResponse {
  landing: {
    id: string;
    projectId: string;
    slug: string;
    archiveFilename: string;
    uploadedAt: string;
    fileCount: number;
    totalSizeBytes: number;
    url: string;
  } | null;
}