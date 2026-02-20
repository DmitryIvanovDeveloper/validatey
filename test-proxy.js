const https = require('https');

async function testProxy() {
  console.log('🧪 Testing Cerebras Proxy API\n');

  const testPrompt = 'Hello, this is a test prompt. Please respond with a simple greeting.';

  try {
    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({
        prompt: testPrompt
        // Try without model parameter first
      });

      const req = https.request({
        hostname: 'cerebras-api.vercel.app',
        port: 443,
        path: '/api/prompt',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: jsonData });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: data });
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    });

    console.log('Status:', response.statusCode);
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testProxy().catch(console.error);