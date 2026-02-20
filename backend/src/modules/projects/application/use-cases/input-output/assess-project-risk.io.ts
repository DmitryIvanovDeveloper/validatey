import type { ProjectRiskAssessment } from '../../../domain/value-objects/project-risk.vo';

export type AssessProjectRiskRequest = {
  hypothesis: string;
  segment: string;
  assumptions: string[];
};

export type AssessProjectRiskResponse = {
  assessment: ProjectRiskAssessment;
};
