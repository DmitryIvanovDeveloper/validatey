export interface FetchJobStateDTO {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  commentsCount: number;
  error?: string;
  currentSourceName?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GetFetchStatusResponse {
  jobs: FetchJobStateDTO[];
}