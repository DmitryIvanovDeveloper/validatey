import ResultEx from '../../../../infrastructure/result/result';

export interface UserStory {
  id: string;
  role: string;
  goal: string;
  benefit: string;
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
  functionalArea: string;
  /** Optional: one short phrase from context suggesting how to address the need (e.g. "Support via task prioritization"). */
  solutionDirection?: string;
}

/** One key assumption with research validation status — prefer stories for confirmed/need_more; avoid not_supported. */
export interface KeyAssumptionForStories {
  text: string;
  status: 'confirmed' | 'need_more' | 'not_supported';
  evidence?: string;
}

/** Short quote from a comment pattern — use wording when writing acceptance criteria. */
export interface PatternQuoteForStories {
  patternLabel: string;
  quote: string;
}

export interface UserStoriesInput {
  projectName: string;
  hypothesisSummary: string;
  marketSummary: string;
  synthesisReport: {
    summary: string;
    verdict: string;
    recommendations: string[];
  };
  commentPatternAnalysis?: {
    patterns: Array<{
      type: string;
      label: string;
      insight?: string;
      sentimentScore: number;
      confidenceScore: number;
    }>;
    validationScore: number;
  };
  targetAudience: string;
  commentMetrics?: {
    totalCount: number;
    bySource: Record<string, number>;
  };
  /** Top pain points from research — prioritize stories that address these. */
  topPainPoints?: string[];
  /** Key assumptions with validation status — prefer stories for confirmed/need_more; avoid not_supported. */
  keyAssumptions?: KeyAssumptionForStories[];
  /** One short quote per pattern — use when phrasing acceptance criteria for traceability. */
  patternExampleQuotes?: PatternQuoteForStories[];
}

export class UserStoriesGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: 'LLM_ERROR' | 'INVALID_RESPONSE' | 'NETWORK_ERROR',
    public readonly contentPreview?: string
  ) {
    super(message);
    this.name = 'UserStoriesGenerationError';
  }
}

export interface UserStoriesLlmPort {
  generateUserStories(input: UserStoriesInput): Promise<ResultEx<UserStory[], UserStoriesGenerationError>>;
}