import { injectable } from 'inversify';
import type { CommentPatternAnalyzerPort } from '../../application/ports/comment-pattern-analyzer.port';
import type { CommentEntity } from '../../domain/entities/comment.entity';
import type {
  CommentPattern,
  CommentPatternAnalysis,
  CommentPatternExample,
  PatternType,
} from '../../domain/value-objects/comment-pattern-analysis.vo';
import type { PatternRule, ScoreWeight } from '../../domain/value-objects/pattern-rules.vo';

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function buildExample(comment: CommentEntity, maxLen = 200): CommentPatternExample {
  const content = comment.content.trim();
  // Fair Use: limit to 200 characters for analysis examples
  const truncated = content.length > maxLen ? content.slice(0, maxLen) + '…' : content;

  return {
    content: truncated,
    author: comment.author ?? 'Anonymous',
    source: comment.contextTitle ?? 'Unknown source',
    url: comment.url, // Add URL for proper attribution
  };
}

function buildInsight(template: string, count: number, total: number): string {
  const pct = Math.round((count / total) * 100);
  return template
    .replace('{count}', String(count))
    .replace('{pct}', String(pct));
}

function computeValidationScore(
  patterns: CommentPattern[],
  total: number,
  weights: ScoreWeight[],
  recurrenceScore?: number
): number {
  if (total === 0) return 0;

  let score = 0;
  let globalBonus50 = 0;
  let globalBonus100 = 0;

  for (const weight of weights) {
    const pattern = patterns.find((p) => p.type === weight.patternType);
    if (pattern) {
      const contribution = Math.min(
        weight.maxScore,
        Math.round((pattern.count / total) * 100 * weight.multiplier)
      );
      score += contribution;
    }
    globalBonus50 = Math.max(globalBonus50, weight.volumeBonus50);
    globalBonus100 = Math.max(globalBonus100, weight.volumeBonus100);
  }

  if (total >= 50) score = Math.min(100, score + globalBonus50);
  if (total >= 100) score = Math.min(100, score + globalBonus100);

  // Recurrence bonus: same theme in multiple subreddits = strong signal (+5 to +15)
  if (typeof recurrenceScore === 'number' && recurrenceScore > 0) {
    const recurrenceBonus = Math.round(recurrenceScore * 15);
    score = Math.min(100, score + recurrenceBonus);
  }

  return Math.min(100, score);
}

@injectable()
export class KeywordCommentPatternAnalyzerAdapter implements CommentPatternAnalyzerPort {
  analyze(
    comments: CommentEntity[],
    rules: PatternRule[],
    weights: ScoreWeight[]
  ): CommentPatternAnalysis {
    const total = comments.length;

    if (total === 0) {
      return {
        totalComments: 0,
        patterns: [],
        validationScore: 0,
        sentimentOverview: { overall: 0, distribution: { positive: 0, neutral: 100, negative: 0 } },
        temporalTrends: { recentActivity: 0, trendDirection: 'stable' },
        analyzedAt: new Date()
      };
    }

    // Subreddit distribution (Reddit subsourceName, e.g. r/startups)
    const subredditDistribution: Record<string, number> = {};
    for (const c of comments) {
      const sub = c.subsourceName?.trim();
      if (sub && (sub.startsWith('r/') || /^[a-zA-Z0-9_]+$/.test(sub))) {
        const key = sub.startsWith('r/') ? sub : `r/${sub}`;
        subredditDistribution[key] = (subredditDistribution[key] ?? 0) + 1;
      }
    }

    const patterns: CommentPattern[] = rules
      .reduce<CommentPattern[]>((acc, rule) => {
        const matched = comments.filter((c) => containsAny(c.content, rule.keywords));
        const count = matched.length;

        if (count === 0) return acc;

        const uniqueSubreddits = new Set<string>();
        for (const c of matched) {
          const sub = c.subsourceName?.trim();
          if (sub && (sub.startsWith('r/') || /^[a-zA-Z0-9_]+$/.test(sub))) {
            uniqueSubreddits.add(sub.startsWith('r/') ? sub : `r/${sub}`);
          }
        }
        const subredditCount = uniqueSubreddits.size;
        const subredditNames = subredditCount > 0 ? [...uniqueSubreddits] : undefined;

        const examples: CommentPatternExample[] = matched
          .slice(0, rule.maxExamples)
          .map((c) => buildExample(c));

        acc.push({
          type: rule.type,
          label: rule.label,
          insight: buildInsight(rule.insightTemplate, count, total),
          count,
          percentage: Math.round((count / total) * 100),
          sentimentScore: this.estimateSentimentScore(rule.type),
          confidenceScore: Math.min(0.7, count / total + 0.3),
          recencyScore: 0.5,
          commentIds: matched.slice(0, 100).map((c) => c.id),
          subredditCount: subredditCount || undefined,
          subredditNames,
          examples,
        });

        return acc;
      }, [])
      .sort((a, b) => b.count - a.count);

    // Recurrence: share of patterns that appear in >= 2 subreddits (0–1)
    const patternsWithRecurrence = patterns.filter((p) => (p.subredditCount ?? 0) >= 2).length;
    const recurrenceScore = patterns.length > 0 ? patternsWithRecurrence / patterns.length : 0;

    const validationScore = computeValidationScore(patterns, total, weights, recurrenceScore);

    const sentimentOverview = this.computeSentimentOverview(patterns, total);

    // Detect actual platforms from subsourceName instead of assuming Reddit/Mixed
    const platformCounts: Record<string, number> = {};
    for (const c of comments) {
      const sub = c.subsourceName?.toLowerCase() ?? '';
      let platform: string;
      if (sub.includes('hacker news') || sub.includes('hackernews') || sub.startsWith('hn')) {
        platform = 'HackerNews';
      } else if (Object.keys(subredditDistribution).length > 0 || sub.startsWith('r/') || sub.includes('reddit')) {
        platform = 'Reddit';
      } else if (sub.includes('product hunt') || sub.includes('producthunt')) {
        platform = 'ProductHunt';
      } else if (sub.includes('linkedin')) {
        platform = 'LinkedIn';
      } else {
        platform = sub || 'Unknown';
      }
      platformCounts[platform] = (platformCounts[platform] ?? 0) + 1;
    }

    const dominantPlatform = Object.entries(platformCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';
    const platformSentiments: Record<string, number> = {};
    for (const platform of Object.keys(platformCounts)) {
      platformSentiments[platform] = sentimentOverview.overall;
    }

    const hasSubreddits = Object.keys(subredditDistribution).length > 0;
    const platformInsights = {
      dominantPlatform,
      platformDistribution: platformCounts,
      platformSentiments,
      ...(hasSubreddits && { subredditDistribution }),
      ...(hasSubreddits && { recurrenceScore }),
    };

    // Basic temporal trends (can't determine from keywords)
    const temporalTrends = {
      recentActivity: 0.5,
      trendDirection: 'stable' as const
    };

    return {
      totalComments: total,
      patterns,
      validationScore,
      sentimentOverview,
      platformInsights,
      temporalTrends,
      analyzedAt: new Date()
    };
  }

  private estimateSentimentScore(type: PatternType): number {
    // Basic sentiment mapping based on pattern type
    switch (type) {
      case 'failure':
        return -0.6; // Negative
      case 'myth':
        return -0.3; // Mildly negative
      case 'advice':
        return 0.2; // Mildly positive
      case 'validation':
        return 0.5; // Positive
      case 'feature_request':
        return 0.1; // Neutral-positive
      case 'comparison':
        return 0.0; // Neutral
      case 'workaround':
        return -0.1; // Mildly negative
      default:
        return 0.0;
    }
  }

  private computeSentimentOverview(patterns: CommentPattern[], totalComments: number) {
    if (patterns.length === 0) {
      return { overall: 0, distribution: { positive: 0, neutral: 100, negative: 0 } };
    }

    // Calculate weighted sentiment
    let totalWeightedSentiment = 0;
    let totalWeight = 0;

    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;

    for (const pattern of patterns) {
      const weight = pattern.count;
      totalWeightedSentiment += pattern.sentimentScore * weight;
      totalWeight += weight;

      if (pattern.sentimentScore > 0.1) positiveCount += pattern.count;
      else if (pattern.sentimentScore < -0.1) negativeCount += pattern.count;
      else neutralCount += pattern.count;
    }

    const overall = totalWeight > 0 ? totalWeightedSentiment / totalWeight : 0;

    return {
      overall: Math.max(-1, Math.min(1, overall)), // Clamp to -1..1
      distribution: {
        positive: Math.round((positiveCount / totalComments) * 100),
        neutral: Math.round((neutralCount / totalComments) * 100),
        negative: Math.round((negativeCount / totalComments) * 100),
      }
    };
  }
}
