export const TYPES = {
  ResearchRepository: Symbol.for("ResearchRepository"),
  ResearchCanvasQueryRepository: Symbol.for("ResearchCanvasQueryRepository"),
  GetResearchCanvasUseCase: Symbol.for("GetResearchCanvasUseCase"),
  CheckResearchAvailabilityUseCase: Symbol.for("CheckResearchAvailabilityUseCase"),
  CollectResearchDataUseCase: Symbol.for("CollectResearchDataUseCase"),
  GenerateSynthesisUseCase: Symbol.for("GenerateSynthesisUseCase"),
  ResearchAssistantUseCase: Symbol.for("ResearchAssistantUseCase"),
  GenerateUserStoriesUseCase: Symbol.for("GenerateUserStoriesUseCase"),
  ResearchController: Symbol.for("ResearchController"),
} as const;
