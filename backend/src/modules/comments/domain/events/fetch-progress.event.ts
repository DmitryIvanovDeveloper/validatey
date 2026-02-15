/**
 * Domain event: fetch job progress update
 */
export interface FetchProgressEventPayload {
  jobId: string;
  commentsCountSoFar: number;
  currentSourceName: string | null;
}