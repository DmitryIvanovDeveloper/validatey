import { describe, it, expect } from 'vitest';
import { CommentEntity } from './comment.entity';

describe('CommentEntity', () => {
  const baseParams = {
    sourceId: 'src-1',
    projectId: 'proj-1',
    externalId: 'ext-1',
    content: 'Test comment',
    url: 'https://example.com/1',
    createdAt: new Date('2025-01-01T12:00:00Z'),
  };

  describe('create', () => {
    it('should create with score and depth (Reddit signals)', () => {
      const comment = CommentEntity.create({
        ...baseParams,
        score: 42,
        depth: 2,
        subsourceName: 'r/startups',
      });
      expect(comment.score).toBe(42);
      expect(comment.depth).toBe(2);
      expect(comment.subsourceName).toBe('r/startups');
    });

    it('should default score and depth to null when omitted', () => {
      const comment = CommentEntity.create(baseParams);
      expect(comment.score).toBeNull();
      expect(comment.depth).toBeNull();
    });

    it('should include score and depth in toData()', () => {
      const comment = CommentEntity.create({
        ...baseParams,
        score: 10,
        depth: 1,
      });
      const data = comment.toData();
      expect(data.score).toBe(10);
      expect(data.depth).toBe(1);
    });
  });

  describe('withProcessed', () => {
    it('should preserve score and depth', () => {
      const comment = CommentEntity.create({
        ...baseParams,
        score: 5,
        depth: 3,
      });
      const processed = comment.withProcessed(new Date());
      expect(processed.score).toBe(5);
      expect(processed.depth).toBe(3);
    });
  });
});
