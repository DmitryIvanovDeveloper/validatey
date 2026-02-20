import type { ProjectRiskAssessment } from '../../domain/entities/project-risk.entity';

export interface ProjectRiskRepositoryPort {
  assessRisk(hypothesis: string, segment: string, assumptions: string[]): Promise<ProjectRiskAssessment>;
}
