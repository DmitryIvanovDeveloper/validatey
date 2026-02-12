export interface ExportResponsesUseCaseRequest {
  projectId: string;
  format: 'json' | 'csv';
}

export interface ExportResponsesUseCaseResponse {
  data: Blob;
  error?: string;
}