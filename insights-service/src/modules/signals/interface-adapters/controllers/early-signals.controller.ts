import { GetEarlySignalsByProjectIdUseCase } from "../../application/use-cases/get-early-signals-by-project-id.use-case";

export class EarlySignalsController {
  constructor(
    private readonly getEarlySignalsByProjectIdUseCase: GetEarlySignalsByProjectIdUseCase,
  ) {}

  async getByProjectId(projectId: string) {
    return this.getEarlySignalsByProjectIdUseCase.execute(projectId);
  }
}
