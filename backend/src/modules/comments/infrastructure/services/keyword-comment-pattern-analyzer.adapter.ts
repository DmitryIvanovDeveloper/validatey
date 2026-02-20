import { injectable } from 'inversify';
import type { CommentPatternAnalyzerPort } from '../../application/ports/comment-pattern-analyzer.port';
import type { CommentEntity } from '../../domain/entities/comment.entity';
import type {
  CommentPattern,
  CommentPatternAnalysis,
  CommentPatternExample,
  PatternType,
} from '../../domain/value-objects/comment-pattern-analysis.vo';

interface PatternDefinition {
  type: PatternType;
  label: string;
  keywords: string[];
  buildInsight: (count: number, total: number) => string;
}

const PATTERN_DEFINITIONS: PatternDefinition[] = [
  {
    type: 'myth',
    label: 'Startup Myths',
    keywords: ['lie', 'myth', 'believe', 'wrong', 'mistake', 'think', 'thought', 'assumed', 'false', 'delusion', 'trap', 'illusion'],
    buildInsight: (count, total) =>
      `${count} comments (${Math.round((count / total) * 100)}%) mention common startup myths or false beliefs.`,
  },
  {
    type: 'failure',
    label: 'Failure Patterns',
    keywords: ['fail', 'failed', 'failure', 'waste', 'wasted', 'lose', 'lost', 'burn', 'burned', 'zero', 'struggling', 'disaster', 'quit', 'gave up', 'shut down', 'no customers', 'no users'],
    buildInsight: (count, total) =>
      `${count} comments (${Math.round((count / total) * 100)}%) share failure stories or struggles.`,
  },
  {
    type: 'advice',
    label: 'Advice & Lessons',
    keywords: ['should', 'advice', 'lesson', 'learn', 'tip', 'recommend', 'suggest', 'important', 'crucial', 'must', 'key', 'focus on'],
    buildInsight: (count, total) =>
      `${count} comments (${Math.round((count / total) * 100)}%) offer actionable advice or lessons learned.`,
  },
  {
    type: 'validation',
    label: 'Validation Signals',
    keywords: ['validate', 'validation', 'test', 'hypothesis', 'customer', 'problem', 'pain', 'research', 'interview', 'survey', 'feedback', 'market'],
    buildInsight: (count, total) =>
      `${count} comments (${Math.round((count / total) * 100)}%) discuss validation and real customer pain.`,
  },
];

const MAX_EXAMPLES = 3;

function containsAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function buildExample(comment: CommentEntity): CommentPatternExample {
  const content = comment.content.trim();
  return {
    content: content.length > 200 ? content.slice(0, 200) + '…' : content,
    author: comment.author ?? 'Anonymous',
    source: comment.contextTitle ?? 'Unknown source',
  };
}

function computeValidationScore(patterns: CommentPattern[], total: number): number {
  if (total === 0) return 0;

  const mythPattern = patterns.find((p) => p.type === 'myth');
  const failurePattern = patterns.find((p) => p.type === 'failure');
  const advicePattern = patterns.find((p) => p.type === 'advice');
  const validationPattern = patterns.find((p) => p.type === 'validation');

  // More failure + validation signals → higher score (more evidence of real problem)
  let score = 0;
  if (failurePattern) score += Math.min(40, Math.round((failurePattern.count / total) * 100));
  if (validationPattern) score += Math.min(30, Math.round((validationPattern.count / total) * 80));
  if (mythPattern) score += Math.min(20, Math.round((mythPattern.count / total) * 50));
  if (advicePattern) score += Math.min(10, Math.round((advicePattern.count / total) * 20));

  // Bonus for significant comment volume
  if (total >= 50) score = Math.min(100, score + 10);
  if (total >= 100) score = Math.min(100, score + 10);

  return Math.min(100, score);
}

@injectable()
export class KeywordCommentPatternAnalyzerAdapter implements CommentPatternAnalyzerPort {
  analyze(comments: CommentEntity[]): CommentPatternAnalysis {
    const total = comments.length;

    if (total === 0) {
      return {
        totalComments: 0,
        patterns: [],
        validationScore: 0,
        analyzedAt: new Date(),
      };
    }

    const patterns: CommentPattern[] = PATTERN_DEFINITIONS
      .reduce<CommentPattern[]>((acc, def) => {
        const matched = comments.filter((c) => containsAny(c.content, def.keywords));
        const count = matched.length;

        if (count === 0) return acc;

        const examples: CommentPatternExample[] = matched
          .slice(0, MAX_EXAMPLES)
          .map(buildExample);

        acc.push({
          type: def.type,
          label: def.label,
          insight: def.buildInsight(count, total),
          count,
          percentage: Math.round((count / total) * 100),
          examples,
        });

        return acc;
      }, [])
      .sort((a, b) => b.count - a.count);

    const validationScore = computeValidationScore(patterns, total);

    return {
      totalComments: total,
      patterns,
      validationScore,
      analyzedAt: new Date(),
    };
  }
}
