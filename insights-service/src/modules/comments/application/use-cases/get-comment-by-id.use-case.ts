import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export type CommentDto = {
  id: string;
  sourceId: string;
  projectId: string;
  externalId: string;
  content: string;
  author: string;
  url: string;
  contextTitle: string;
  contextUrl: string;
  createdAt: string;
  fetchedAt: string;
  isProcessed: boolean;
  processedAt: string | null;
  importOrigin: string;
  subsourceName: string;
  score?: number;
  depth?: number;
};

export class GetCommentByIdUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(id: string): Promise<ResultEx<{ comment: CommentDto }, Error>> {
    try {
      const repoResult = await this.repository.getById(id);
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      const data = repoResult.data;
      if (!data) return ResultEx.failure(new Error("Comment not found"));

      const row = data as Record<string, unknown>;
      const comment: CommentDto = {
        id: String(row.id ?? ""),
        sourceId: String(row.source_id ?? ""),
        projectId: String(row.project_id ?? ""),
        externalId: String(row.external_id ?? ""),
        content: String(row.content ?? ""),
        author: String(row.author ?? ""),
        url: String(row.url ?? ""),
        contextTitle: String(row.context_title ?? ""),
        contextUrl: String(row.context_url ?? ""),
        createdAt: new Date(String(row.created_at ?? new Date().toISOString())).toISOString(),
        fetchedAt: new Date(String(row.fetched_at ?? new Date().toISOString())).toISOString(),
        isProcessed: Boolean(row.is_processed ?? false),
        processedAt: row.processed_at ? new Date(String(row.processed_at)).toISOString() : null,
        importOrigin: String(row.import_origin ?? ""),
        subsourceName: String(row.subsource_name ?? ""),
        score: typeof row.score === "number" ? row.score : undefined,
        depth: typeof row.depth === "number" ? row.depth : undefined,
      };
      return ResultEx.success({ comment });
    } catch (error) {
      logger.error("comments.get-by-id.exception", { id, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
