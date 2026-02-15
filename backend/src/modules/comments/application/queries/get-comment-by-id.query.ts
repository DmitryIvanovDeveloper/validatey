/**
 * Query: get single comment by ID (CQRS query side).
 */
export interface GetCommentByIdQuery {
  id: string;
}

export interface CommentDetailDTO {
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

export interface GetCommentByIdQueryResult {
  comment: CommentDetailDTO;
}