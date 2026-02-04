export type ExportResponsesUseCaseRequest = {
  projectId: string;
  format: 'json' | 'csv';
};

export type ExportResponsesUseCaseResponse = {
  format: 'json' | 'csv';
  content: string;
  /** One row per answer: question_id, type, value, anonymous_invitation_id, response_id, timestamp */
  rows: Array<{
    response_id: string;
    anonymous_invitation_id: string;
    question_id: string;
    type: string;
    value: string | number;
    timestamp: string;
  }>;
};
