// Debug script to check pattern analysis data
const response = await fetch('http://localhost:8080/api/workspaces/failure-patterns/projects/startup-failure-patterns-analysis/comments/patterns');
const data = await response.json();

console.log('Pattern Analysis Data:');
console.log('Total Comments:', data.totalComments);
console.log('Patterns:');
data.patterns.forEach((pattern, index) => {
  console.log(`${index + 1}. ${pattern.label}: ${pattern.count} comments`);
  console.log(`   Type: ${pattern.type}`);
  console.log(`   Has commentIds: ${!!pattern.commentIds}`);
  if (pattern.commentIds) {
    console.log(`   CommentIds count: ${pattern.commentIds.length}`);
    console.log(`   First few IDs: ${pattern.commentIds.slice(0, 5).join(', ')}`);
  }
  console.log('');
});