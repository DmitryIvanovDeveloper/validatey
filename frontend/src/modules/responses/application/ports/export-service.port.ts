export interface ExportServicePort {
  exportResponses(projectId: string, format: 'json' | 'csv'): Promise<{ data: Blob; error?: string }>;
  exportConsents(projectId: string, format: 'json' | 'csv'): Promise<{ data: Blob; error?: string }>;
}