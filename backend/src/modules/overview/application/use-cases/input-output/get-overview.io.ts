/** Request/Response for GetOverviewUseCase (Overview command center). */

export type GetOverviewRequest = {
  projectId: string;
  /** Required when not using guest access. */
  userId?: string;
  /** When set, access is granted by public slug (guest view); userId is ignored. */
  guestSlug?: string;
};

export type ValidationStatus = 'weak_support' | 'unclear_signal' | 'validated' | 'no_data';

export type ExecutiveSummary = {
  projectName: string;
  status: string;
  validationStatus: ValidationStatus;
  responded: number;
  sent: number;
  responseRatePct: number;
  neededForSignificance: number | null;
  keyInsight: string | null;
  deadline: string | null;
  daysRemaining: number | null;
  paceResponsesPerDay: number;
  aiVerdict: string | null;
  createdAt: string;
};

export type PulseMetric = {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: 'good' | 'warn' | 'low';
  actionLabel: string;
  actionHref: string;
};

export type SmartAction = {
  id: string;
  label: string;
  hint: string;
  href: string;
  priority: number;
};

export type ResearchContext = {
  summary: string | null;
  marketSnippet: string | null;
  competitorsSnippet: string | null;
  hasData: boolean;
};

export type LearningJourneyRound = {
  id: string;
  title: string;
  type: string;
  status: string;
  keyFinding: string | null;
  reportHref: string;
};

export type LearningJourney = {
  rounds: LearningJourneyRound[];
  extendSuggestions: string[];
};

export type DecisionStep = {
  id: string;
  label: string;
  progress: string;
  status: 'done' | 'in_progress' | 'pending';
  actionHref: string | null;
};

export type SuccessCriterion = {
  label: string;
  current: string;
  target: string;
  met: boolean;
};

export type DecisionPathway = {
  steps: DecisionStep[];
  successCriteria: SuccessCriterion[];
  decisionDate: string | null;
};

/** Per-assumption status for Key Assumptions (same order as project.hypothesis.assumptions). */
export type OverviewAssumptionStatus = 'confirmed' | 'need_more' | 'not_supported' | 'not_testable' | 'disproven';

/** Per-assumption assessment for Key Assumptions (status + evidence). */
export type OverviewAssumptionAssessment = {
  assumptionId: string;
  status: string;
  evidence: string | null;
};

/** Synthesis report slice for overview (verdict, summary, recommendations). */
export type OverviewSynthesisReport = {
  summary: string;
  recommendations: string[];
  verdict: string;
};

export type GetOverviewResponse = {
  executiveSummary: ExecutiveSummary;
  pulse: PulseMetric[];
  smartActions: SmartAction[];
  researchContext: ResearchContext;
  learningJourney: LearningJourney;
  decisionPathway: DecisionPathway;
  /** Research synthesis (for Key Assumptions / Executive Summary). */
  synthesisReport?: OverviewSynthesisReport | null;
  /** Per-assumption statuses; length matches project.hypothesis.assumptions. */
  assumptionStatuses?: OverviewAssumptionStatus[] | null;
  /** Per-assumption assessments (status + evidence) for Key Assumptions. */
  assumptionAssessments?: OverviewAssumptionAssessment[] | null;
};
