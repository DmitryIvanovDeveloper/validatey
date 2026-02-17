export const TYPES = {
  ResearchRepository: Symbol('ResearchRepository'),
  ResearchRepositoryPort: Symbol('ResearchRepositoryPort'),
  HttpClientPort: Symbol('HttpClientPort'),
  ResearchPresenter: Symbol('ResearchPresenter'),
  GetResearchCanvasUseCase: Symbol('GetResearchCanvasUseCase'),
  CollectResearchDataUseCase: Symbol('CollectResearchDataUseCase'),
  GenerateSynthesisUseCase: Symbol('GenerateSynthesisUseCase'),
  ResearchAssistantUseCase: Symbol('ResearchAssistantUseCase'),
} as const;