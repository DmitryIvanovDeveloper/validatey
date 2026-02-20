const https = require('https');

function testCerebrasAPISimple() {
  console.log('🧪 Testing Cerebras API (without model parameter)\n');

  const testPrompt = 'Hello, respond with a simple greeting.';

  const postData = JSON.stringify({
    prompt: testPrompt
    // No model parameter
  });

  console.log('📤 Sending request without model parameter...');
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
      'User-Agent': 'Mozilla/5.0 (compatible; Validatey/1.0)'
    }
  };

  const req = https.request(options, (res) => {
    console.log('📥 Response received:');
    console.log('Status Code:', res.statusCode);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n📄 Response Body:');
      try {
        const parsed = JSON.parse(data);
        console.log('Parsed JSON:', JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Raw response:', data);
      }

      console.log('\n' + '='.repeat(80));
      console.log('🏁 Test completed');
    });
  });

  req.on('error', (err) => {
    console.error('❌ Request failed:', err.message);
  });

  req.write(postData);
  req.end();
}

// Run the test
testCerebrasAPISimple();