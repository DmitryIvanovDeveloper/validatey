export interface GetCommentsRequest {
  projectId?: string;
  sourceId?: string;
  url?: string;
  isProcessed?: boolean;
  limit?: number;
  offset?: number;
}

export interface CommentItem {
  id: string;
  sourceId: string;
  projectId: string;
  externalId: string;
  content: string;
  author: string | null;
  url: string;
  contextTitle: string | null;
  contextUrl: string | null;
  createdAt: Date;
  fetchedAt: Date;
  isProcessed: boolean;
  processedAt: Date | null;
  importOrigin: string | null;
  subsourceName: string | null;
  sourceType: 'reddit' | 'hackernews' | 'unknown';
}

export interface GetCommentsResponse {
  comments: CommentItem[];
  totalCount: number;
  hasMore: boolean;
}