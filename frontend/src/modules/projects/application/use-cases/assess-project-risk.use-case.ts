import { injectable, inject } from 'inversify';
import type { ProjectRiskAssessment } from '../../domain/entities/project-risk.entity';
import type { ProjectRiskRepositoryPort } from '../ports/project-risk-repository.port';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class AssessProjectRiskUseCase {
  constructor(
    @inject(TYPES.ProjectRiskRepository)
    private readonly _repository: ProjectRiskRepositoryPort
  ) {}

  async execute(
    hypothesis: string,
    segment: string,
    assumptions: string[]
  ): Promise<ProjectRiskAssessment> {
    return this._repository.assessRisk(hypothesis, segment, assumptions);
  }
}
