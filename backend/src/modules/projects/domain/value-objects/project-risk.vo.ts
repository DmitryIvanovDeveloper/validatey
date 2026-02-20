export type RiskLevel = 'low' | 'medium' | 'high';

export interface ProjectRisk {
  readonly level: RiskLevel;
  readonly patternName: string;
  readonly message: string;
  readonly suggestion: string;
}

export interface ProjectRiskAssessment {
  readonly risks: ProjectRisk[];
  readonly overallRiskScore: number; // 0-100
}
