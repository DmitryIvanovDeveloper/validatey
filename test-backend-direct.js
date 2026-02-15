// Test backend directly without axios
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

async function test() {
  try {
    console.log('Testing backend HN fetch...');

    const response = await postJson('localhost', 8080, '/api/projects/test/comments/fetch', {
      sourceType: 'hackernews',
      hnUrls: ['https://news.ycombinator.com/item?id=46966201']
    });

    console.log('Response status:', response.status);
    console.log('Response data:', response.data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();