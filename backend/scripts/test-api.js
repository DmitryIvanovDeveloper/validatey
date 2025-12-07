const http = require('http');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw: data,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            raw: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Testing Validatey Backend API\n');
  console.log('='.repeat(60));

  const tests = [
    {
      name: 'Health Check',
      path: '/health',
      method: 'GET',
    },
    {
      name: 'API Info',
      path: '/api',
      method: 'GET',
    },
    {
      name: 'Get Projects (without auth)',
      path: '/api/projects',
      method: 'GET',
      expectStatus: 400, // Should fail without x-user-id
    },
    {
      name: 'Get Projects (with auth)',
      path: '/api/projects',
      method: 'GET',
      headers: { 'x-user-id': 'test-user-123' },
      expectStatus: 200,
    },
    {
      name: 'Create Project',
      path: '/api/projects',
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: {
        name: 'Test Project',
        status: 'draft',
      },
      expectStatus: 201,
    },
    {
      name: 'Telemetry',
      path: '/api/telemetry',
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: {
        event: 'test',
        data: { test: true },
      },
      expectStatus: 204, // Telemetry returns 204 No Content
    },
    {
      name: 'Get Scenarios (nested, with version)',
      path: '/api/projects/test-project-id/scenarios?version=1',
      method: 'GET',
      headers: { 'x-user-id': 'test-user-123' },
      expectStatus: [200, 404, 501], // 404 if project/scenario doesn't exist, 501 if not implemented
    },
    {
      name: 'Get Invitations by Project',
      path: '/api/invitations/project/test-project-id',
      method: 'GET',
      headers: { 'x-user-id': 'test-user-123' },
      expectStatus: 501, // Not implemented yet
    },
    {
      name: 'Get Metrics by Project',
      path: '/api/metrics/test-project-id',
      method: 'GET',
      headers: { 'x-user-id': 'test-user-123' },
      expectStatus: 501, // Not implemented yet
    },
    {
      name: 'Calculate Metrics',
      path: '/api/metrics/calculate/test-project-id',
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      expectStatus: [200, 400, 404], // May fail if project doesn't exist
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n📋 ${test.name}`);
      console.log(`   ${test.method} ${test.path}`);
      
      const result = await makeRequest(test.path, test.method, test.headers || {}, test.body || null);
      
      const expectedStatus = test.expectStatus || 200;
      const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      const statusOk = expectedStatuses.includes(result.statusCode);
      
      if (statusOk) {
        console.log(`   ✅ Status: ${result.statusCode} (expected ${expectedStatus})`);
        passed++;
      } else {
        console.log(`   ❌ Status: ${result.statusCode} (expected ${expectedStatus})`);
        console.log(`   Response: ${JSON.stringify(result.body, null, 2).substring(0, 200)}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

testAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

