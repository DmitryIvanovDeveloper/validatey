import { describe, it, expect } from 'vitest';
import { KeywordCommentPatternAnalyzerAdapter } from './keyword-comment-pattern-analyzer.adapter';
import { CommentEntity } from '../../domain/entities/comment.entity';
import type { PatternRule, ScoreWeight } from '../../domain/value-objects/pattern-rules.vo';

function comment(id: string, content: string, subsourceName: string | null): CommentEntity {
  return CommentEntity.create({
    id,
    sourceId: 'src-1',
    projectId: 'proj-1',
    externalId: `ext-${id}`,
    content,
    url: 'https://example.com/1',
    createdAt: new Date(),
    subsourceName,
  });
}

const rules: PatternRule[] = [
  {
    id: 'r1',
    type: 'validation',
    label: 'Users validate problem',
    keywords: ['problem', 'pain', 'frustrated'],
    insightTemplate: '{count} comments ({pct}%) mention problem',
    maxExamples: 3,
    isActive: true,
  },
  {
    id: 'r2',
    type: 'advice',
    label: 'Users give advice',
    keywords: ['should', 'recommend', 'try'],
    insightTemplate: '{count} comments ({pct}%) give advice',
    maxExamples: 2,
    isActive: true,
  },
];

const weights: ScoreWeight[] = [
  {
    patternType: 'validation',
    maxScore: 40,
    multiplier: 1,
    volumeBonus50: 5,
    volumeBonus100: 10,
  },
  {
    patternType: 'advice',
    maxScore: 20,
    multiplier: 0.5,
    volumeBonus50: 0,
    volumeBonus100: 0,
  },
];

describe('KeywordCommentPatternAnalyzerAdapter', () => {
  const analyzer = new KeywordCommentPatternAnalyzerAdapter();

  describe('subreddit distribution and recurrence', () => {
    it('should set subredditDistribution and recurrenceScore when comments have subsourceName', () => {
      const comments = [
        comment('1', 'We have a big problem with onboarding', 'r/startups'),
        comment('2', 'The main pain is pricing', 'r/startups'),
        comment('3', 'Users are frustrated with support', 'r/SaaS'),
        comment('4', 'I recommend trying X', 'r/startups'),
        comment('5', 'You should try Y', 'r/SaaS'),
      ];
      const result = analyzer.analyze(comments, rules, weights);

      expect(result.platformInsights.subredditDistribution).toBeDefined();
      expect(result.platformInsights.subredditDistribution!['r/startups']).toBe(3);
      expect(result.platformInsights.subredditDistribution!['r/SaaS']).toBe(2);
      expect(result.platformInsights.recurrenceScore).toBeDefined();
      // Both patterns (validation + advice) appear in 2 subreddits => recurrenceScore = 1
      expect(result.platformInsights.recurrenceScore).toBe(1);
    });

    it('should add subredditCount and subredditNames to each pattern when from Reddit', () => {
      const comments = [
        comment('1', 'Problem with scaling', 'r/startups'),
        comment('2', 'Pain point is UX', 'r/SaaS'),
        comment('3', 'Frustrated users', 'r/startups'),
      ];
      const result = analyzer.analyze(comments, rules, weights);

      const validationPattern = result.patterns.find((p) => p.type === 'validation');
      expect(validationPattern).toBeDefined();
      expect(validationPattern!.subredditCount).toBe(2);
      expect(validationPattern!.subredditNames).toContain('r/startups');
      expect(validationPattern!.subredditNames).toContain('r/SaaS');
    });

    it('should apply recurrence bonus to validationScore', () => {
      const commentsOneSub = [
        comment('1', 'problem pain', 'r/startups'),
        comment('2', 'problem frustrated', 'r/startups'),
      ];
      const commentsTwoSubs = [
        comment('1', 'problem pain', 'r/startups'),
        comment('2', 'problem frustrated', 'r/SaaS'),
      ];
      const resultOne = analyzer.analyze(commentsOneSub, rules, weights);
      const resultTwo = analyzer.analyze(commentsTwoSubs, rules, weights);

      expect(resultTwo.platformInsights.recurrenceScore).toBeGreaterThan(0);
      expect(resultOne.platformInsights.recurrenceScore).toBe(0);
      // With recurrence, validation score gets +recurrenceBonus (up to 15)
      expect(resultTwo.validationScore).toBeGreaterThanOrEqual(resultOne.validationScore);
    });
  });

  describe('no subreddit data', () => {
    it('should not set subredditDistribution or recurrenceScore when subsourceName is null', () => {
      const comments = [
        comment('1', 'problem and pain', null),
        comment('2', 'frustrated users', null),
      ];
      const result = analyzer.analyze(comments, rules, weights);

      expect(result.platformInsights.subredditDistribution).toBeUndefined();
      expect(result.platformInsights.recurrenceScore).toBeUndefined();
      expect(result.patterns.every((p) => p.subredditCount == null)).toBe(true);
    });
  });
});
