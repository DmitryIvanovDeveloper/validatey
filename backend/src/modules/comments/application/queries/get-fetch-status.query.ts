/**
 * Query: get fetch status (CQRS query side).
 */
export interface GetFetchStatusQuery {}

export interface FetchJobStateDTO {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  commentsCount: number;
  error?: string;
  currentSourceName?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GetFetchStatusQueryResult {
  jobs: FetchJobStateDTO[];
}