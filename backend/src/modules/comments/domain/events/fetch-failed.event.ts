/**
 * Domain event: fetch job failed
 */
export interface FetchFailedEventPayload {
  jobId: string;
  error: string;
  completedAt: Date;
}