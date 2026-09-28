import { GetCommentByIdUseCase } from "../../application/use-cases/get-comment-by-id.use-case";
import { GetCommentsUseCase } from "../../application/use-cases/get-comments.use-case";
import { GetCommentsActivityUseCase } from "../../application/use-cases/get-comments-activity.use-case";
import { GetCommentsFreshnessUseCase } from "../../application/use-cases/get-comments-freshness.use-case";
import { GetPatternAnalysisUseCase } from "../../application/use-cases/get-pattern-analysis.use-case";
import { GetSuggestedOutreachUseCase } from "../../application/use-cases/get-suggested-outreach.use-case";
import { GetCommentsByAuthorUseCase } from "../../application/use-cases/get-comments-by-author.use-case";
import { CreateCommentSourceUseCase } from "../../application/use-cases/create-comment-source.use-case";
import { ListCommentSourcesUseCase } from "../../application/use-cases/list-comment-sources.use-case";
import { DeleteCommentSourceUseCase } from "../../application/use-cases/delete-comment-source.use-case";
import { GetPatternCommentsUseCase } from "../../application/use-cases/get-pattern-comments.use-case";
import { StartCommentsFetchUseCase } from "../../application/use-cases/start-comments-fetch.use-case";

export class CommentsController {
  constructor(
    private readonly getCommentByIdUseCase: GetCommentByIdUseCase,
    private readonly getCommentsUseCase: GetCommentsUseCase,
    private readonly getCommentsActivityUseCase: GetCommentsActivityUseCase,
    private readonly getCommentsFreshnessUseCase: GetCommentsFreshnessUseCase,
    private readonly getPatternAnalysisUseCase: GetPatternAnalysisUseCase,
    private readonly getSuggestedOutreachUseCase: GetSuggestedOutreachUseCase,
    private readonly getCommentsByAuthorUseCase: GetCommentsByAuthorUseCase,
    private readonly createCommentSourceUseCase: CreateCommentSourceUseCase,
    private readonly listCommentSourcesUseCase: ListCommentSourcesUseCase,
    private readonly deleteCommentSourceUseCase: DeleteCommentSourceUseCase,
    private readonly getPatternCommentsUseCase: GetPatternCommentsUseCase,
    private readonly startCommentsFetchUseCase: StartCommentsFetchUseCase,
  ) {}

  async getCommentById(id: string) {
    return this.getCommentByIdUseCase.execute(id);
  }

  async getComments(input: { projectId: string; limit?: number; sourceId?: string; periodMonths?: number }) {
    return this.getCommentsUseCase.execute(input);
  }

  async getCommentsActivity(input: { projectId: string; bucket: "week" | "month"; maxBuckets: number }) {
    return this.getCommentsActivityUseCase.execute(input);
  }

  async getCommentsFreshness(projectId: string) {
    return this.getCommentsFreshnessUseCase.execute(projectId);
  }

  async getPatternAnalysis(projectId: string) {
    return this.getPatternAnalysisUseCase.execute(projectId);
  }

  async getSuggestedOutreach(projectId: string, limit: number) {
    return this.getSuggestedOutreachUseCase.execute(projectId, limit);
  }

  async getCommentsByAuthor(input: {
    projectId: string;
    author: string;
    sourceType?: "reddit" | "hackernews";
    limit?: number;
  }) {
    return this.getCommentsByAuthorUseCase.execute(input);
  }

  async fetchComments() {
    return this.startCommentsFetchUseCase.execute();
  }

  async getFetchStatus() {
    return this.startCommentsFetchUseCase.status();
  }

  async createSource(input: {
    projectId: string;
    sourceType: "reddit" | "hackernews";
    redditUrl?: string;
    hnUrl?: string;
    hnFeedType?: string;
  }) {
    return this.createCommentSourceUseCase.execute(input);
  }

  async getSources(projectId: string) {
    return this.listCommentSourcesUseCase.execute(projectId);
  }

  async deleteSource(input: { projectId: string; sourceId: string }) {
    return this.deleteCommentSourceUseCase.execute(input);
  }

  async getPatternComments(input: {
    projectId: string;
    patternType: string;
    patternIndex?: number;
    commentIdsFromQuery?: string[];
  }) {
    return this.getPatternCommentsUseCase.execute(input);
  }
}
