import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

export type Recommendation = 'go' | 'iterate' | 'stop';

export interface RecommendationResult {
  recommendation: Recommendation;
  reasoning: string;
  confidence: number;
}

@injectable()
export class RecommendationEngineService {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  generateRecommendation(metrics: {
    problemSeverity: {
      average: number;
      highScoresCount: number;
      criticalScoresCount: number;
    };
    wtp: {
      median: number;
      mean: number;
    };
    clusterCount: number;
  }): RecommendationResult {
    this._logger.info('recommendation-engine.generate', { metrics });

    let score = 0;
    const reasons: string[] = [];

    // Problem severity scoring
    if (metrics.problemSeverity.average >= 4.5) {
      score += 3;
      reasons.push('Very high problem severity (≥4.5)');
    } else if (metrics.problemSeverity.average >= 4) {
      score += 2;
      reasons.push('High problem severity (≥4.0)');
    } else if (metrics.problemSeverity.average >= 3) {
      score += 1;
      reasons.push('Moderate problem severity (≥3.0)');
    } else {
      reasons.push('Low problem severity (<3.0)');
    }

    // WTP scoring
    if (metrics.wtp.median > 0) {
      if (metrics.wtp.median >= 100) {
        score += 2;
        reasons.push('Strong willingness to pay (≥$100)');
      } else if (metrics.wtp.median >= 50) {
        score += 1;
        reasons.push('Moderate willingness to pay (≥$50)');
      } else {
        reasons.push('Low willingness to pay (<$50)');
      }
    }

    // Cluster diversity
    if (metrics.clusterCount >= 5) {
      score += 1;
      reasons.push('Diverse feedback clusters (≥5)');
    }

    // Generate recommendation
    let recommendation: Recommendation;
    let confidence: number;

    if (score >= 5) {
      recommendation = 'go';
      confidence = 0.8;
      reasons.push('Strong positive signals across all metrics');
    } else if (score >= 3) {
      recommendation = 'iterate';
      confidence = 0.6;
      reasons.push('Mixed signals - needs iteration');
    } else {
      recommendation = 'stop';
      confidence = 0.7;
      reasons.push('Weak signals - consider stopping');
    }

    return {
      recommendation,
      reasoning: reasons.join('; '),
      confidence,
    };
  }
}



