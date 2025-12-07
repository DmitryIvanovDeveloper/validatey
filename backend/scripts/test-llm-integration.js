const http = require('http');

const BASE_URL = 'http://localhost:3000';
const LLM_URL = 'http://localhost:8080';

function makeRequest(path, method = 'GET', headers = {}, body = null, baseUrl = BASE_URL) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (baseUrl.includes('8080') ? 8080 : 3000),
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

async function testLLMIntegration() {
  console.log('🧪 Testing LLM Service Integration\n');
  console.log('='.repeat(70));

  let projectId = null;

  // Step 1: Check LLM service health
  console.log('\n📋 1. Checking LLM Service Health');
  try {
    const llmHealth = await makeRequest('/health', 'GET', {}, null, LLM_URL);
    if (llmHealth.statusCode === 200) {
      console.log(`   ✅ LLM Service is running on ${LLM_URL}`);
    } else {
      console.log(`   ⚠️  LLM Service returned status ${llmHealth.statusCode}`);
    }
  } catch (error) {
    console.log(`   ❌ LLM Service is not accessible: ${error.message}`);
    console.log(`   Make sure LLM service is running on ${LLM_URL}`);
    return;
  }

  // Step 2: Create a test project
  console.log('\n📋 2. Creating Test Project');
  try {
    const createResult = await makeRequest('/api/projects', 'POST', {
      'x-user-id': 'test-user-llm-123',
    }, {
      name: 'LLM Integration Test Project',
      status: 'draft',
      segment: {
        description: 'Молодые профессионалы 25-35 лет, работающие в IT-сфере',
        demographics: {
          age: '25-35',
          profession: 'IT',
          location: 'Москва',
        },
      },
      hypothesis: {
        description: 'Пользователи хотят быстро проверять гипотезы без сложных инструментов',
        assumptions: [
          'Пользователи не хотят тратить много времени на настройку',
          'Нужен простой интерфейс',
        ],
      },
    });

    if (createResult.statusCode === 201) {
      const project = createResult.body?.project || createResult.body;
      if (project && project.id) {
        projectId = project.id;
        console.log(`   ✅ Project created: ${projectId}`);
        console.log(`   📝 Name: ${project.name}`);
      } else {
        console.log(`   ⚠️  Project created but ID not found in response`);
        return;
      }
    } else {
      console.log(`   ❌ Failed to create project: ${createResult.statusCode}`);
      console.log(`   Response: ${JSON.stringify(createResult.body, null, 2)}`);
      return;
    }
  } catch (error) {
    console.log(`   ❌ Error creating project: ${error.message}`);
    return;
  }

  // Step 3: Generate scenario via LLM
  console.log('\n📋 3. Generating Scenario via LLM');
  try {
    const generateResult = await makeRequest(
      `/api/projects/${projectId}/scenarios/generate`,
      'POST',
      {
        'x-user-id': 'test-user-llm-123',
      },
      {
        metadata: {
          tone: 'professional',
          length: 10,
        },
      }
    );

    if (generateResult.statusCode === 201) {
      const scenario = generateResult.body?.scenario || generateResult.body;
      console.log(`   ✅ Scenario generated successfully!`);
      console.log(`   📝 Scenario ID: ${scenario.id}`);
      console.log(`   📝 Version: ${scenario.version}`);
      console.log(`   📝 Status: ${scenario.status}`);
      console.log(`   📝 Is Generated: ${scenario.isGenerated}`);
      console.log(`   📝 Is Edited: ${scenario.isEdited}`);
      if (scenario.metadata) {
        console.log(`   📝 Metadata: ${JSON.stringify(scenario.metadata, null, 2)}`);
      }
      if (scenario.content) {
        const contentPreview = scenario.content.substring(0, 200);
        console.log(`   📝 Content preview: ${contentPreview}...`);
      }
    } else {
      console.log(`   ❌ Failed to generate scenario: ${generateResult.statusCode}`);
      console.log(`   Response: ${JSON.stringify(generateResult.body, null, 2)}`);
    }
  } catch (error) {
    console.log(`   ❌ Error generating scenario: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log(`   ⚠️  Connection refused - LLM service might not be running`);
    }
  }

  // Step 4: Get generated scenario
  if (projectId) {
    console.log('\n📋 4. Retrieving Generated Scenario');
    try {
      const getResult = await makeRequest(
        `/api/projects/${projectId}/scenarios?version=1`,
        'GET',
        {
          'x-user-id': 'test-user-llm-123',
        }
      );

      if (getResult.statusCode === 200) {
        const scenario = getResult.body?.scenario || getResult.body;
        console.log(`   ✅ Scenario retrieved successfully!`);
        console.log(`   📝 Version: ${scenario.version}`);
        console.log(`   📝 Status: ${scenario.status}`);
      } else if (getResult.statusCode === 404) {
        console.log(`   ⚠️  Scenario not found (might not be saved yet)`);
      } else {
        console.log(`   ⚠️  Unexpected status: ${getResult.statusCode}`);
      }
    } catch (error) {
      console.log(`   ❌ Error retrieving scenario: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n✅ LLM Integration Test Complete!');
}

testLLMIntegration().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

