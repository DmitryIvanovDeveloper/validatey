/** Research summary slice returned by overview API (backend-aggregated). No dependency on research module. */
export interface OverviewResearchSummary {
  readonly synthesisReport?: {
    readonly verdict?: string;
    readonly summary?: string;
    readonly recommendations?: string[];
  } | null;
  readonly assumptionStatuses?: readonly ('confirmed' | 'need_more' | 'not_supported')[] | null;
  readonly assumptionAssessments?: ReadonlyArray<{
    readonly assumptionId: string;
    readonly status: string;
    readonly evidence: string | null;
  }> | null;
}

export interface OverviewExecutiveSummary {
  readonly projectName: string;
  readonly status: string;
  readonly validationStatus: string;
  readonly responded: number;
  readonly sent: number;
  readonly responseRatePct: number;
  readonly neededForSignificance: number | null;
  readonly keyInsight: string | null;
  readonly deadline: string | null;
  readonly daysRemaining: number | null;
  readonly paceResponsesPerDay: number;
  readonly aiVerdict: string | null;
  readonly createdAt: string;
}

export interface OverviewPulseItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly status: string;
  readonly actionLabel: string;
  readonly actionHref: string;
}

export interface OverviewSmartAction {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly href: string;
}

export interface OverviewResearchContext {
  readonly summary: string | null;
  readonly marketSnippet: string | null;
  readonly competitorsSnippet: string | null;
  readonly hasData: boolean;
}

export interface OverviewRound {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly status: string;
  readonly keyFinding: string | null;
  readonly reportHref: string;
}

export interface OverviewLearningJourney {
  readonly rounds: readonly OverviewRound[];
  readonly extendSuggestions: readonly string[];
}

export interface OverviewDecisionStep {
  readonly id: string;
  readonly label: string;
  readonly progress: string;
  readonly status: string;
  readonly actionHref: string | null;
}

export interface OverviewSuccessCriterion {
  readonly label: string;
  readonly current: string;
  readonly target: string;
  readonly met: boolean;
}

export interface OverviewDecisionPathway {
  readonly steps: readonly OverviewDecisionStep[];
  readonly successCriteria: readonly OverviewSuccessCriterion[];
  readonly decisionDate: string | null;
}

/** Full overview payload from GET /projects/:id/overview. Includes optional research summary from backend. */
export interface OverviewPayload {
  readonly executiveSummary: OverviewExecutiveSummary;
  readonly pulse: readonly OverviewPulseItem[];
  readonly smartActions: readonly OverviewSmartAction[];
  readonly researchContext: OverviewResearchContext;
  readonly learningJourney: OverviewLearningJourney;
  readonly decisionPathway: OverviewDecisionPathway;
  /** Backend-aggregated research data (synthesis + assumption assessments). Optional until API is extended. */
  readonly synthesisReport?: OverviewResearchSummary['synthesisReport'];
  readonly assumptionStatuses?: OverviewResearchSummary['assumptionStatuses'];
  readonly assumptionAssessments?: OverviewResearchSummary['assumptionAssessments'];
}

export interface GetProjectOverviewRequest {
  readonly projectId: string;
}

export interface GetProjectOverviewResponse {
  readonly overview: OverviewPayload;
}
