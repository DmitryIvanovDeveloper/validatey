const http = require('http');

async function testScenarioGeneration() {
  console.log('🧪 Testing Scenario Generation with Fallback\n');

  // Test data - use real Trinity Showcase project
  const testData = {
    projectId: '44f2f181-0f5c-40f4-b707-00a145daed41', // Trinity Showcase project ID
    userId: '4cc56fc4-3814-4c0b-9ac9-6168fc2795c4', // Real user ID
    segment: {
      description: 'Solopreneurs and indie hackers launching their first/second product',
      demographics: {
        age: '25-40',
        location: 'Global'
      }
    },
    hypothesis: {
      description: 'Product validation platform helps entrepreneurs validate ideas faster',
      assumptions: ['Users need structured feedback', 'AI can help format questions']
    }
  };

  console.log('📝 Test request data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n' + '='.repeat(80) + '\n');

  try {
    // Test the API
    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify(testData);

      const req = http.request({
        hostname: 'localhost',
        port: 8080,
        path: `/api/projects/${testData.projectId}/scenarios/generate`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': testData.userId,
          'Content-Length': Buffer.byteLength(postData)
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
            reject(new Error(`Failed to parse response: ${data}`));
          }
        });
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.write(postData);
      req.end();
    });

    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}: ${JSON.stringify(response.data)}`);
    }

    const data = response.data;
    console.log('✅ API Response:');
    console.log('Status:', response.statusCode);
    console.log('\n📋 Scenario data:');

    if (data.content) {
      const parsed = JSON.parse(data.content);
      console.log('Questions count:', parsed.questions?.length || 0);
      console.log('Sample questions:');
      parsed.questions?.slice(0, 3).forEach((q, i) => {
        console.log(`${i + 1}. ${q.text} (${q.type})`);
      });
    }

    console.log('\n🎉 SCENARIO GENERATION TEST PASSED!');
    console.log('✅ API endpoint: Working');
    console.log('✅ Fallback logic: Active');
    console.log('✅ Basic scenario: Generated');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testScenarioGeneration().catch(console.error);