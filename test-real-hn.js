// Test real HN comments
const http = require('http');

function postJson(host, port, path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testRealHn() {
  try {
    console.log('Testing real HN comments fetch...');

    const response = await postJson('localhost', 8080, '/api/projects/25f05152-c9fd-42ae-81d6-3801e3d1fbc6/comments/fetch', {
      sourceType: 'hackernews',
      hnUrls: ['https://news.ycombinator.com/item?id=46966201']
    });

    console.log('Fetch response status:', response.status);
    console.log('Response data:', response.data);

    // Wait for processing
    console.log('Waiting for processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check comments
    const getResponse = await http.get({
      hostname: 'localhost',
      port: 8080,
      path: '/api/projects/25f05152-c9fd-42ae-81d6-3801e3d1fbc6/comments',
      method: 'GET'
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(body);
          console.log('Comments count:', data.comments?.length || 0);
          if (data.comments && data.comments.length > 0) {
            console.log('First comment:', {
              author: data.comments[0].author,
              contentStart: data.comments[0].content.substring(0, 100) + '...'
            });
          }
        } catch (e) {
          console.log('Parse error:', e.message);
        }
      });
    });

    getResponse.on('error', (error) => {
      console.error('GET error:', error.message);
    });

  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testRealHn();