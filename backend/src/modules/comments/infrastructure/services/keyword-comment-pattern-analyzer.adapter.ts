import { injectable } from 'inversify';
import type { CommentPatternAnalyzerPort } from '../../application/ports/comment-pattern-analyzer.port';
import type { CommentEntity } from '../../domain/entities/comment.entity';
import type {
  CommentPattern,
  CommentPatternAnalysis,
  CommentPatternExample,
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
  weights: ScoreWeight[]
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
      return { totalComments: 0, patterns: [], validationScore: 0, analyzedAt: new Date() };
    }

    const patterns: CommentPattern[] = rules
      .reduce<CommentPattern[]>((acc, rule) => {
        const matched = comments.filter((c) => containsAny(c.content, rule.keywords));
        const count = matched.length;

        if (count === 0) return acc;

        const examples: CommentPatternExample[] = matched
          .slice(0, rule.maxExamples)
          .map((c) => buildExample(c));

        acc.push({
          type: rule.type,
          label: rule.label,
          insight: buildInsight(rule.insightTemplate, count, total),
          count,
          percentage: Math.round((count / total) * 100),
          examples,
        });

        return acc;
      }, [])
      .sort((a, b) => b.count - a.count);

    const validationScore = computeValidationScore(patterns, total, weights);

    return { totalComments: total, patterns, validationScore, analyzedAt: new Date() };
  }
}
