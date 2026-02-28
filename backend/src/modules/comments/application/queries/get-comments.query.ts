/**
 * Query: list comments (CQRS query side).
 */
export interface GetCommentsQuery {
  projectId?: string;
  sourceId?: string;
  url?: string;
  isProcessed?: boolean;
  limit?: number;
  periodMonths?: number;
  fromDate?: Date;
  toDate?: Date;
}

export interface CommentListItemDTO {
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
}

export interface GetCommentsQueryResult {
  comments: CommentListItemDTO[];
  totalCount: number;
  hasMore: boolean;
}