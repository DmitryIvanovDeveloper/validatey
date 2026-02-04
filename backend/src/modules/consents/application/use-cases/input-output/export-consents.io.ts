export type ExportConsentsUseCaseRequest = {
  projectId: string;
  format: 'json' | 'csv';
};

export type ExportConsentsUseCaseResponse = {
  format: 'json' | 'csv';
  content: string;
  rows: Array<{
    consent_id: string;
    project_id: string;
    invitation_id: string;
    consent_text_id: string | null;
    accepted_at: string;
    created_at: string;
  }>;
};
