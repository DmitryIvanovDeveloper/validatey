export interface UploadLandingUseCaseRequest {
  projectId: string;
  file: File;
}

export interface UploadLandingUseCaseResponse {
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