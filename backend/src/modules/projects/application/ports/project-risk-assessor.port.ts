import type { ProjectRiskAssessment } from '../../domain/value-objects/project-risk.vo';

export interface ProjectRiskAssessorPort {
  assess(hypothesis: string, segment: string, assumptions: string[]): Promise<ProjectRiskAssessment>;
}
