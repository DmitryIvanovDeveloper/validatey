import ResultEx from '../../../../infrastructure/result/result';
import type { ResearchIntent } from '../use-cases/input-output/collect-research-data.io';

/**
 * Port for AI-powered generation of relevant Reddit subreddits for research.
 * Generates subreddit names based on product hypothesis and research intent.
 */
export interface RedditSubredditsGeneratorPort {
  generateSubreddits(intent: ResearchIntent): Promise<ResultEx<string[], Error>>;
}