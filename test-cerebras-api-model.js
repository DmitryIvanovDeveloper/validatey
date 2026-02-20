const https = require('https');

// Test different model names
const modelsToTest = [
  'llama3.1-8b',
  'llama-3.1-8b',
  'llama3.1-70b',
  'llama-3.1-70b',
  'llama3-8b',
  'llama3-70b'
];

async function testModel(model) {
  return new Promise((resolve) => {
    const testPrompt = 'Say "Hello" and nothing else.';

    const postData = JSON.stringify({
      prompt: testPrompt,
      model: model
    });

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
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            model,
            status: res.statusCode,
            error: parsed.error || null,
            hasResponse: !!parsed.response
          });
        } catch (e) {
          resolve({
            model,
            status: res.statusCode,
            error: 'Invalid JSON',
            hasResponse: false
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        model,
        status: 'ERROR',
        error: err.message,
        hasResponse: false
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        model,
        status: 'TIMEOUT',
        error: 'Request timeout',
        hasResponse: false
      });
    });

    req.write(postData);
    req.end();
  });
}

async function testAllModels() {
  console.log('🧪 Testing different Cerebras API models\n');

  for (const model of modelsToTest) {
    console.log(`🔍 Testing model: ${model}`);
    const result = await testModel(model);

    if (result.hasResponse) {
      console.log(`✅ SUCCESS: ${model} - Status: ${result.status}`);
    } else if (result.error && result.error.includes('does not exist')) {
      console.log(`❌ NOT FOUND: ${model} - ${result.error}`);
    } else {
      console.log(`⚠️  ERROR: ${model} - Status: ${result.status}, Error: ${result.error}`);
    }
    console.log('---');
  }

  console.log('🏁 Model testing completed');
}

// Run the test
testAllModels();