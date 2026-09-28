import ResultEx from "../../../../infrastructure/result/result";
import type { CommentsQueryRepositoryPort } from "../ports/comments-query-repository.port";

export class CreateCommentSourceUseCase {
  constructor(private readonly repository: CommentsQueryRepositoryPort) {}

  async execute(input: {
    projectId: string;
    sourceType: "reddit" | "hackernews";
    redditUrl?: string;
    hnUrl?: string;
    hnFeedType?: string;
  }): Promise<ResultEx<Record<string, unknown>, Error>> {
    return this.repository.createSource(input);
  }
}
