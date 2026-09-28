import { Container } from "inversify";
import { TYPES } from "./types";
import { SupabaseCommentsQueryRepository } from "../repositories/supabase-comments-query.repository";
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
import { CommentsController } from "../../interface-adapters/controllers/comments.controller";

export function bindComments(container: Container): void {
  container.bind(TYPES.CommentsQueryRepository).toConstantValue(new SupabaseCommentsQueryRepository());
  container.bind(TYPES.GetCommentByIdUseCase).toConstantValue(new GetCommentByIdUseCase(container.get(TYPES.CommentsQueryRepository)));
  container.bind(TYPES.GetCommentsUseCase).toConstantValue(new GetCommentsUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.GetCommentsActivityUseCase)
    .toConstantValue(new GetCommentsActivityUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.GetCommentsFreshnessUseCase)
    .toConstantValue(new GetCommentsFreshnessUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.GetPatternAnalysisUseCase)
    .toConstantValue(new GetPatternAnalysisUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.GetSuggestedOutreachUseCase)
    .toConstantValue(new GetSuggestedOutreachUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.GetCommentsByAuthorUseCase)
    .toConstantValue(new GetCommentsByAuthorUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.CreateCommentSourceUseCase)
    .toConstantValue(new CreateCommentSourceUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.ListCommentSourcesUseCase)
    .toConstantValue(new ListCommentSourcesUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.DeleteCommentSourceUseCase)
    .toConstantValue(new DeleteCommentSourceUseCase(container.get(TYPES.CommentsQueryRepository)));
  container
    .bind(TYPES.GetPatternCommentsUseCase)
    .toConstantValue(new GetPatternCommentsUseCase(container.get(TYPES.CommentsQueryRepository)));
  container.bind(TYPES.StartCommentsFetchUseCase).toConstantValue(new StartCommentsFetchUseCase());
  container.bind(TYPES.CommentsController).toConstantValue(
    new CommentsController(
      container.get(TYPES.GetCommentByIdUseCase),
      container.get(TYPES.GetCommentsUseCase),
      container.get(TYPES.GetCommentsActivityUseCase),
      container.get(TYPES.GetCommentsFreshnessUseCase),
      container.get(TYPES.GetPatternAnalysisUseCase),
      container.get(TYPES.GetSuggestedOutreachUseCase),
      container.get(TYPES.GetCommentsByAuthorUseCase),
      container.get(TYPES.CreateCommentSourceUseCase),
      container.get(TYPES.ListCommentSourcesUseCase),
      container.get(TYPES.DeleteCommentSourceUseCase),
      container.get(TYPES.GetPatternCommentsUseCase),
      container.get(TYPES.StartCommentsFetchUseCase),
    ),
  );
}
