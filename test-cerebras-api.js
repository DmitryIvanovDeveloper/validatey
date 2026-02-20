const https = require('https');

function testCerebrasAPI() {
  console.log('🧪 Testing Cerebras API: https://cerebras-api.vercel.app/\n');

  const testPrompt = 'Hello, respond with a simple greeting.';

  const postData = JSON.stringify({
    prompt: testPrompt,
    model: 'llama3.1-8b'
  });

  console.log('📤 Sending request...');
  console.log('URL: https://cerebras-api.vercel.app/api/prompt');
  console.log('Method: POST');
  console.log('Body:', postData);
  console.log('\n' + '='.repeat(80) + '\n');

  const options = {
    hostname: 'cerebras-api.vercel.app',
    port: 443,
    path: '/api/prompt',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  };

  const req = https.request(options, (res) => {
    console.log('📥 Response received:');
    console.log('Status Code:', res.statusCode);
    console.log('Headers:', JSON.stringify(res.headers, null, 2));

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n📄 Response Body:');
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));

        if (parsed.response) {
          console.log('\n✅ API Response contains "response" field');
          console.log('Response text:', parsed.response);
        } else {
          console.log('\n⚠️  API Response does not contain "response" field');
        }
      } catch (e) {
        console.log('Raw response:', data);
        console.log('\n❌ Response is not valid JSON');
      }

      console.log('\n' + '='.repeat(80));
      console.log('🏁 Test completed');
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
    console.error('Error details:', err);
  });

  req.write(postData);
  req.end();
}

// Run the test
testCerebrasAPI();