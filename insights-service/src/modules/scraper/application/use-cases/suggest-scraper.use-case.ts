import ResultEx from "../../../../infrastructure/result/result";
import type { SuggestScraperRequest, SuggestScraperResponse } from "./input-output/scraper-source.io";

export class SuggestScraperUseCase {
  async execute(request: SuggestScraperRequest): Promise<ResultEx<SuggestScraperResponse, Error>> {
    const text = request.message.toLowerCase();
    const type = text.includes("competitor")
      ? "competitor_sites"
      : text.includes("job")
        ? "job_market"
        : text.includes("news")
          ? "news_articles"
          : text.includes("review")
            ? "user_reviews"
            : "custom";
    return ResultEx.success({
      suggestion: {
        type,
        urls: [],
        whatToCollect: ["title", "content", "author"],
        frequency: "weekly",
        aiProcessing: "analyze_trends",
      },
    });
  }
}
