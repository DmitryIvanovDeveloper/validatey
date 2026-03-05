export interface ServeLandingFileUseCaseRequest {
  slug: string;
  filepath: string;
}

export interface ServeLandingFileUseCaseResponse {
  buffer: Buffer;
  contentType: string;
  filename: string;
}