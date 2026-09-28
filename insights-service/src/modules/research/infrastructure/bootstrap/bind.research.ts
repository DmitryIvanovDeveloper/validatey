import { Container } from "inversify";
import { TYPES } from "./types";
import { SupabaseResearchRepository } from "../repositories/supabase-research.repository";
import { SupabaseResearchCanvasQueryRepository } from "../repositories/supabase-research-canvas-query.repository";
import { CheckResearchAvailabilityUseCase } from "../../application/use-cases/check-research-availability.use-case";
import { GetResearchCanvasUseCase } from "../../application/use-cases/get-research-canvas.use-case";
import { ResearchController } from "../../interface-adapters/controllers/research.controller";
import { CollectResearchDataUseCase } from "../../application/use-cases/collect-research-data.use-case";
import { GenerateSynthesisUseCase } from "../../application/use-cases/generate-synthesis.use-case";
import { ResearchAssistantUseCase } from "../../application/use-cases/research-assistant.use-case";
import { GenerateUserStoriesUseCase } from "../../application/use-cases/generate-user-stories.use-case";

export function bindResearch(container: Container): void {
  container.bind(TYPES.ResearchRepository).toConstantValue(new SupabaseResearchRepository());
  container.bind(TYPES.ResearchCanvasQueryRepository).toConstantValue(new SupabaseResearchCanvasQueryRepository());
  container
    .bind(TYPES.GetResearchCanvasUseCase)
    .toConstantValue(new GetResearchCanvasUseCase(container.get(TYPES.ResearchCanvasQueryRepository)));
  container
    .bind(TYPES.CheckResearchAvailabilityUseCase)
    .toConstantValue(new CheckResearchAvailabilityUseCase(container.get(TYPES.ResearchRepository)));
  container
    .bind(TYPES.CollectResearchDataUseCase)
    .toConstantValue(new CollectResearchDataUseCase(container.get(TYPES.ResearchRepository)));
  container
    .bind(TYPES.GenerateSynthesisUseCase)
    .toConstantValue(new GenerateSynthesisUseCase(container.get(TYPES.ResearchRepository)));
  container
    .bind(TYPES.ResearchAssistantUseCase)
    .toConstantValue(new ResearchAssistantUseCase(container.get(TYPES.ResearchRepository)));
  container
    .bind(TYPES.GenerateUserStoriesUseCase)
    .toConstantValue(new GenerateUserStoriesUseCase(container.get(TYPES.ResearchRepository)));
  container.bind(TYPES.ResearchController).toConstantValue(
    new ResearchController(
      container.get(TYPES.GetResearchCanvasUseCase),
      container.get(TYPES.CheckResearchAvailabilityUseCase),
      container.get(TYPES.CollectResearchDataUseCase),
      container.get(TYPES.GenerateSynthesisUseCase),
      container.get(TYPES.ResearchAssistantUseCase),
      container.get(TYPES.GenerateUserStoriesUseCase),
    ),
  );
}
