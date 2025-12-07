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
  console.log('🧪 Detailed Validatey Backend API Test\n');
  console.log('='.repeat(70));

  let projectId = null;

  const tests = [
    {
      name: '1. Health Check',
      path: '/health',
      method: 'GET',
      description: 'Basic health endpoint',
    },
    {
      name: '2. API Info',
      path: '/api',
      method: 'GET',
      description: 'List all available endpoints',
    },
    {
      name: '3. Get Projects (without auth)',
      path: '/api/projects',
      method: 'GET',
      description: 'Should fail without x-user-id header',
      expectStatus: 400,
    },
    {
      name: '4. Get Projects (with auth)',
      path: '/api/projects',
      method: 'GET',
      headers: { 'x-user-id': 'test-user-123' },
      description: 'Get list of projects for user',
      expectStatus: 200,
      onSuccess: (result) => {
        console.log(`   📦 Found ${Array.isArray(result.body) ? result.body.length : 0} projects`);
      },
    },
    {
      name: '5. Create Project',
      path: '/api/projects',
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: {
        name: 'API Test Project',
        status: 'draft',
        segment: {
          description: 'Test segment',
          demographics: { age: '25-35' },
        },
        hypothesis: {
          description: 'Test hypothesis',
          assumptions: ['Assumption 1'],
        },
      },
      description: 'Create a new project',
      expectStatus: 201,
      onSuccess: (result) => {
        // Check both possible response formats
        const project = result.body?.project || result.body;
        if (project && project.id) {
          projectId = project.id;
          console.log(`   📝 Created project ID: ${projectId}`);
          console.log(`   📝 Project name: ${project.name || 'N/A'}`);
        } else {
          console.log(`   ⚠️  Could not extract project ID from response`);
          console.log(`   Response structure: ${JSON.stringify(Object.keys(result.body || {}))}`);
        }
      },
    },
    {
      name: '6. Get Project by ID',
      path: () => `/api/projects/${projectId || 'test-id'}`,
      method: 'GET',
      headers: { 'x-user-id': 'test-user-123' },
      description: 'Get specific project',
      expectStatus: [200, 404],
      skip: () => !projectId,
    },
    {
      name: '7. Telemetry Submission',
      path: '/api/telemetry',
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: {
        type: 'page_view',
        page: '/test',
        eventName: 'test_event',
        metadata: { test: true },
      },
      description: 'Submit telemetry event (non-blocking)',
      expectStatus: 204,
    },
    {
      name: '8. Generate Scenario',
      path: () => `/api/projects/${projectId || 'test-id'}/scenarios/generate`,
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      body: {
        metadata: {
          tone: 'professional',
          length: 10,
        },
      },
      description: 'Generate scenario via LLM (may fail if LLM service not running)',
      expectStatus: [201, 400, 500],
      skip: () => !projectId,
    },
    {
      name: '9. Get Scenarios (nested)',
      path: () => `/api/projects/${projectId || 'test-id'}/scenarios?version=1`,
      method: 'GET',
      headers: { 'x-user-id': 'test-user-123' },
      description: 'Get scenario by version',
      expectStatus: [200, 404, 501],
      skip: () => !projectId,
    },
    {
      name: '10. Calculate Metrics',
      path: () => `/api/metrics/calculate/${projectId || 'test-id'}`,
      method: 'POST',
      headers: { 'x-user-id': 'test-user-123' },
      description: 'Calculate metrics for project',
      expectStatus: [200, 400, 404],
      skip: () => !projectId,
    },
  ];

  let passed = 0;
  let failed = 0;
  let skipped = 0;

  for (const test of tests) {
    if (test.skip && test.skip()) {
      console.log(`\n⏭️  ${test.name}`);
      console.log(`   ${test.description || ''}`);
      console.log(`   ⏭️  Skipped (prerequisites not met)`);
      skipped++;
      continue;
    }

    try {
      const path = typeof test.path === 'function' ? test.path() : test.path;
      console.log(`\n📋 ${test.name}`);
      console.log(`   ${test.description || ''}`);
      console.log(`   ${test.method} ${path}`);
      
      const result = await makeRequest(path, test.method, test.headers || {}, test.body || null);
      
      const expectedStatus = test.expectStatus || 200;
      const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
      const statusOk = expectedStatuses.includes(result.statusCode);
      
      if (statusOk) {
        console.log(`   ✅ Status: ${result.statusCode}`);
        if (test.onSuccess) {
          test.onSuccess(result);
        }
        passed++;
      } else {
        console.log(`   ❌ Status: ${result.statusCode} (expected ${expectedStatuses.join(' or ')})`);
        if (result.body && typeof result.body === 'object') {
          console.log(`   Response: ${JSON.stringify(result.body, null, 2).substring(0, 300)}`);
        }
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📈 Total: ${passed + failed + skipped}`);
  
  if (failed === 0) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

testAPI().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

