import { GetResearchCanvasUseCase } from "../../application/use-cases/get-research-canvas.use-case";
import { CheckResearchAvailabilityUseCase } from "../../application/use-cases/check-research-availability.use-case";
import { CollectResearchDataUseCase } from "../../application/use-cases/collect-research-data.use-case";
import { GenerateSynthesisUseCase } from "../../application/use-cases/generate-synthesis.use-case";
import { ResearchAssistantUseCase } from "../../application/use-cases/research-assistant.use-case";
import { GenerateUserStoriesUseCase } from "../../application/use-cases/generate-user-stories.use-case";

export class ResearchController {
  constructor(
    private readonly getResearchCanvasUseCase: GetResearchCanvasUseCase,
    private readonly checkResearchAvailabilityUseCase: CheckResearchAvailabilityUseCase,
    private readonly collectResearchDataUseCase: CollectResearchDataUseCase,
    private readonly generateSynthesisUseCase: GenerateSynthesisUseCase,
    private readonly researchAssistantUseCase: ResearchAssistantUseCase,
    private readonly generateUserStoriesUseCase: GenerateUserStoriesUseCase,
  ) {}

  async getCanvas(projectId: string) {
    return this.getResearchCanvasUseCase.execute(projectId);
  }

  async checkAvailability(projectId: string) {
    return this.checkResearchAvailabilityUseCase.execute({ projectId });
  }

  async collect(projectId: string) {
    return this.collectResearchDataUseCase.execute({ projectId });
  }

  async synthesis(projectId: string) {
    return this.generateSynthesisUseCase.execute({ projectId });
  }

  async assistant(projectId: string, message: string) {
    return this.researchAssistantUseCase.execute({ projectId, message });
  }

  async userStories(projectId: string) {
    return this.generateUserStoriesUseCase.execute({ projectId });
  }
}
