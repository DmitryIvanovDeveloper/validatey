// Simple test to validate HN URL parsing
const CommentSourceValueObject = require('./backend/src/modules/comments/domain/value-objects/comment-source.vo.ts');

try {
  // Test Reddit URL parsing
  const redditSource = CommentSourceValueObject.createReddit('https://reddit.com/r/test/comments/123/test');
  console.log('Reddit source:', redditSource.toData());

  // Test HN URL parsing
  const hnSource = CommentSourceValueObject.createHackerNews('https://news.ycombinator.com/item?id=46966201');
  console.log('HN source:', hnSource.toData());

  console.log('Test passed!');
} catch (error) {
  console.error('Test failed:', error);
}