import ResultEx from "../../../../infrastructure/result/result";

export type CommentRecord = Record<string, unknown>;
export type PatternRecord = Record<string, unknown>;
export type SuggestedOutreachRecord = {
  author: string;
  sourceType: "reddit" | "hackernews";
  commentCount: number;
  supportingCount: number;
  lastCommentAt: string;
  profileUrl: string;
};

export interface CommentsQueryRepositoryPort {
  getById(id: string): Promise<ResultEx<CommentRecord | null, Error>>;
  listByProject(input: {
    projectId: string;
    limit: number;
    sourceId?: string;
    periodMonths?: number;
  }): Promise<ResultEx<CommentRecord[], Error>>;
  getActivity(input: {
    projectId: string;
    bucket: "week" | "month";
    maxBuckets: number;
  }): Promise<ResultEx<Array<{ bucket: string; count: number }>, Error>>;
  getFreshness(projectId: string): Promise<
    ResultEx<{ oldestCommentAt: string; newestCommentAt: string; totalCount: number; isStale: boolean } | null, Error>
  >;
  getPatternAnalysis(projectId: string): Promise<ResultEx<PatternRecord, Error>>;
  getSuggestedOutreach(projectId: string, limit: number): Promise<ResultEx<SuggestedOutreachRecord[], Error>>;
  getByAuthor(input: {
    projectId: string;
    author: string;
    sourceType?: "reddit" | "hackernews";
    limit: number;
  }): Promise<ResultEx<CommentRecord[], Error>>;
  createSource(input: {
    projectId: string;
    sourceType: "reddit" | "hackernews";
    redditUrl?: string;
    hnUrl?: string;
    hnFeedType?: string;
    postId?: string;
    subredditName?: string;
    hnItemId?: string;
  }): Promise<ResultEx<CommentRecord, Error>>;
  listSources(projectId: string): Promise<ResultEx<CommentRecord[], Error>>;
  deleteSource(projectId: string, sourceId: string): Promise<ResultEx<boolean, Error>>;
  listPatternComments(input: {
    projectId: string;
    patternType: string;
    patternIndex?: number;
    commentIdsFromQuery?: string[];
  }): Promise<ResultEx<{ comments: CommentRecord[]; pattern: PatternRecord | null }, Error>>;
}
