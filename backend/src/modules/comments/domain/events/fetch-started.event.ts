/**
 * Domain event: fetch job started
 */
export interface FetchStartedEventPayload {
  jobId: string;
  sourceId?: string;
  projectId: string;
  sourceType: 'reddit' | 'hackernews';
  redditUrl?: string;
  subredditName?: string;
  postId?: string;
  hnFeedType?: string;
  periodDays: number | null;
  startedAt: Date;
}