export interface UploadLandingUseCaseRequest {
  projectId: string;
  archiveBuffer: Buffer;
  archiveFilename: string;
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
  };
}