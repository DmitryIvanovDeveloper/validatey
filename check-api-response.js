const http = require('http');

const options = {
  hostname: 'localhost',
  port: 8080,
  path: '/api/projects/25f05152-c9fd-42ae-81d6-3801e3d1fbc6/comments',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Status:', res.statusCode);
      console.log('Total comments:', jsonData.comments?.length || 0);
      console.log('Has more:', jsonData.hasMore);
      console.log('Total count:', jsonData.totalCount);

      // Count by source type
      const sourceTypes = {};
      jsonData.comments?.forEach(comment => {
        const type = comment.sourceType || 'unknown';
        sourceTypes[type] = (sourceTypes[type] || 0) + 1;
      });

      console.log('Source types:', sourceTypes);

      // Show first comment
      if (jsonData.comments?.length > 0) {
        const firstComment = jsonData.comments[0];
        console.log('First comment:', {
          id: firstComment.id,
          sourceType: firstComment.sourceType,
          author: firstComment.author,
          content: firstComment.content?.slice(0, 50) + '...'
        });
      }
    } catch (error) {
      console.error('Parse error:', error.message);
      console.log('Raw response (first 500 chars):', data.slice(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();