/**
 * Domain event: fetch job completed successfully
 */
export interface FetchCompletedEventPayload {
  jobId: string;
  success: boolean;
  commentsCount: number;
  commentsBySource: Record<string, number>;
  errors: string[] | null;
  fetchedAt: Date;
}