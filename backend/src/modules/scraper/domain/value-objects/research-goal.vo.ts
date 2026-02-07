/** Links scraper source to hypothesis intent. Used for presets and UI. */
export type ResearchGoal =
  | 'price_strategy'
  | 'user_pains'
  | 'market_trends'
  | 'competitor_features'
  | 'find_respondents';

export const RESEARCH_GOALS: ResearchGoal[] = [
  'price_strategy',
  'user_pains',
  'market_trends',
  'competitor_features',
  'find_respondents',
];

export const RESEARCH_GOAL_LABELS: Record<ResearchGoal, string> = {
  price_strategy: 'Checking pricing strategy',
  user_pains: 'Finding user pain points',
  market_trends: 'Analyzing market trends',
  competitor_features: 'Comparing features with competitors',
  find_respondents: 'Finding potential respondents',
};

/** Preset: goal -> default type, whatToCollect, frequency for auto-fill. */
export const RESEARCH_GOAL_PRESETS: Record<
  ResearchGoal,
  { type: string; whatToCollect: string[]; frequency: string }
> = {
  price_strategy: {
    type: 'competitor_sites',
    whatToCollect: ['Prices', 'plans', 'discounts'],
    frequency: 'weekly',
  },
  user_pains: {
    type: 'user_reviews',
    whatToCollect: ['Complaints', 'issues', 'rating'],
    frequency: 'weekly',
  },
  market_trends: {
    type: 'news_articles',
    whatToCollect: ['Trends', 'forecasts', 'statistics'],
    frequency: 'daily',
  },
  competitor_features: {
    type: 'competitor_sites',
    whatToCollect: ['Features', 'comparison', 'CTA'],
    frequency: 'weekly',
  },
  find_respondents: {
    type: 'job_market',
    whatToCollect: ['Roles', 'skills', 'companies'],
    frequency: 'once',
  },
};

export function isResearchGoal(value: string): value is ResearchGoal {
  return RESEARCH_GOALS.includes(value as ResearchGoal);
}
