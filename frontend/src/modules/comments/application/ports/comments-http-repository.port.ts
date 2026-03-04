import Result from '../../../../infrastructure/result/result';

export interface FetchJobStateDTO {
  jobId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  commentsCount: number;
  error?: string;
  currentSourceName?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface CommentDTO {
  id: string;
  sourceId: string;
  projectId: string;
  externalId: string;
  content: string;
  author: string | null;
  url: string;
  contextTitle: string | null;
  contextUrl: string | null;
  createdAt: string;
  fetchedAt: string;
  isProcessed: boolean;
  processedAt: string | null;
  importOrigin: string | null;
  subsourceName: string | null;
  sourceType?: 'reddit' | 'hackernews' | 'linkedin';
  /** Reddit upvotes (score). */
  score?: number | null;
  /** Reddit depth in thread. */
  depth?: number | null;
}

export interface GetCommentsResponseDTO {
  comments: CommentDTO[];
  totalCount?: number;
  hasMore?: boolean;
}

export interface SuggestedOutreachCommenterDTO {
  author: string;
  sourceType: 'reddit' | 'hackernews';
  commentCount: number;
  supportingCount: number;
  lastCommentAt: string;
  profileUrl: string;
}

export interface CreateSourceInput {
  sourceType: 'reddit' | 'hackernews' | 'linkedin';
  redditUrl?: string;
  hnUrl?: string;
  linkedinUrl?: string;
  hnFeedType?: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
}

export interface SourceDTO {
  id: string;
  sourceType: 'reddit' | 'hackernews' | 'linkedin';
  redditUrl?: string;
  hnUrl?: string;
  linkedinUrl?: string;
  subredditName?: string;
  hnFeedType?: string;
  hnItemId?: string;
  createdAt: string;
}

export interface CommentsHttpRepositoryPort {
  startFetch(
    projectId: string,
    options: {
      sourceType?: 'reddit' | 'hackernews' | 'linkedin';
      redditUrls?: string[];
      hnFeedType?: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
      hnUrls?: string[];
      linkedinUrls?: string[];
      periodDays?: number;
    }
  ): Promise<Result<{ started: boolean }, Error>>;

  getFetchStatus(projectId: string): Promise<Result<FetchJobStateDTO, Error>>;

  getComments(
    projectId: string,
    options?: {
      sourceId?: string;
      url?: string;
      isProcessed?: boolean;
      limit?: number;
      periodMonths?: number;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<Result<GetCommentsResponseDTO, Error>>;

  getCommentsActivity(
    projectId: string,
    params: { bucket: 'week' | 'month'; maxBuckets?: number }
  ): Promise<Result<{ buckets: { bucket: string; count: number }[] }, Error>>;

  getCommentsFreshness(
    projectId: string
  ): Promise<Result<{ oldestCommentAt: string; newestCommentAt: string; totalCount: number; isStale: boolean } | null, Error>>;

  getSuggestedOutreach(
    projectId: string,
    options?: { limit?: number }
  ): Promise<Result<{ commenters: SuggestedOutreachCommenterDTO[] }, Error>>;

  getCommentsByAuthor(
    projectId: string,
    params: { author: string; sourceType?: 'reddit' | 'hackernews'; supportingOnly?: boolean; limit?: number }
  ): Promise<Result<{ comments: CommentDTO[] }, Error>>;

  createSource(projectId: string, input: CreateSourceInput): Promise<Result<SourceDTO, Error>>;

  deleteSource(projectId: string, sourceId: string): Promise<Result<void, Error>>;

  getCommentSources(projectId: string): Promise<Result<{ id: string; sourceType: 'reddit' | 'hackernews' | 'linkedin'; redditUrl?: string; hnUrl?: string; linkedinUrl?: string }[], Error>>;
}