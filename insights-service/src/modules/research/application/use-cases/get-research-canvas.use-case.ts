import ResultEx from "../../../../infrastructure/result/result";
import { logger } from "../../../../infrastructure/logging/logger";
import type { ResearchCanvasQueryRepositoryPort } from "../ports/research-canvas-query-repository.port";

type RecommendedTemplate = {
  name: string;
  slug: string;
  description: string;
};

type ResearchCanvasDto = {
  projectId: string;
  marketData: Record<string, unknown>;
  competitorInfo: Record<string, unknown>;
  userInsights: Record<string, unknown>;
  autocompleteInsights: Record<string, unknown> | null;
  earlySignals: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
  }> | null;
};

export type GetResearchCanvasResponse = {
  canvas: ResearchCanvasDto;
  synthesisReport?: Record<string, unknown> | null;
  projectName?: string;
  projectHypothesis?: string;
  recommendedTemplate?: RecommendedTemplate;
  assumptionStatuses?: string[] | null;
  assumptionAssessments?: Array<{ assumptionId: string; status: string; evidence: string | null }> | null;
  researchStatus?: "idle" | "collecting" | "synthesizing";
  researchStatusUpdatedAt?: string | null;
  userStories?: Array<Record<string, unknown>> | null;
  userStoriesGeneratedAt?: string | null;
};

function getRecommendedTemplate(slug: string): RecommendedTemplate {
  const map: Record<string, RecommendedTemplate> = {
    wtp: {
      name: "Problem Validation (WTP)",
      slug: "wtp",
      description: "Validates problem severity and willingness to pay.",
    },
    "feature-demand": {
      name: "Feature Validation",
      slug: "feature-demand",
      description: "Measures interest in a specific feature.",
    },
    "value-prop": {
      name: "Value Proposition Test",
      slug: "value-prop",
      description: "Tests value proposition resonance.",
    },
  };
  return map[slug] ?? map.wtp;
}

export class GetResearchCanvasUseCase {
  constructor(private readonly repository: ResearchCanvasQueryRepositoryPort) {}

  async execute(projectId: string): Promise<ResultEx<GetResearchCanvasResponse, Error>> {
    try {
      const repoResult = await this.repository.loadCanvasData(projectId);
      if (!repoResult.isSuccess) return ResultEx.failure(repoResult.error);
      const { project, research, signals } = repoResult.data;
      const earlySignals = signals.length > 0 ? signals : null;

      const canvas: ResearchCanvasDto = {
        projectId,
        marketData: (research.market_data as Record<string, unknown>) ?? {},
        competitorInfo: (research.competitor_data as Record<string, unknown>) ?? {},
        userInsights: (research.user_insights as Record<string, unknown>) ?? {},
        autocompleteInsights: (research.autocomplete_insights as Record<string, unknown> | null) ?? null,
        earlySignals,
      };

      const templateSlug = String(project?.scenario_template_slug ?? "wtp");
      const response: GetResearchCanvasResponse = {
        canvas,
        synthesisReport: (research.synthesis_report as Record<string, unknown> | null) ?? null,
        projectName: project?.name,
        projectHypothesis: project?.hypothesis?.description,
        recommendedTemplate: getRecommendedTemplate(templateSlug),
        assumptionStatuses: (research.assumption_statuses as string[] | null) ?? null,
        assumptionAssessments:
          (research.assumption_assessments as Array<{ assumptionId: string; status: string; evidence: string | null }> | null) ??
          null,
        researchStatus: (research.research_status as "idle" | "collecting" | "synthesizing" | undefined) ?? "idle",
        researchStatusUpdatedAt: (research.research_status_updated_at as string | null) ?? null,
        userStories: (research.user_stories as Array<Record<string, unknown>> | null) ?? null,
        userStoriesGeneratedAt: (research.user_stories_generated_at as string | null) ?? null,
      };

      return ResultEx.success(response);
    } catch (error) {
      logger.error("get-research-canvas.exception", { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error("Unknown error"));
    }
  }
}
