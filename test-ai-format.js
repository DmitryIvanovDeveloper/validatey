const http = require('http');

async function testAIFormat() {
  console.log('🧪 Testing Enhanced AI Format functionality...\n');

  // Test data with quotes
  const testText = `Their main pain: "Nobody sees my product". "I don't know if the problem is real". "I need 50 comments".`;

  console.log('📝 Original text:');
  console.log(testText);
  console.log('\n' + '='.repeat(100) + '\n');

  try {
    // Test the API using http module
    const postData = JSON.stringify({ text: testText });

    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 8080,
        path: '/api/ai/format-text',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      throw new Error(`HTTP ${response.statusCode}`);
    }

    const data = response.data;

    console.log('✅ API Response:');
    console.log('Status:', response.status);
    console.log('\n📋 Formatted text:');
    console.log(data.formatted);
    console.log('\n' + '='.repeat(100) + '\n');

    // Check if text was formatted
    const originalLength = testText.length;
    const formattedLength = data.formatted.length;
    const hasChanges = testText !== data.formatted;

    console.log('📊 Analysis:');
    console.log('Original length:', originalLength, 'characters');
    console.log('Formatted length:', formattedLength, 'characters');
    console.log('Text changed:', hasChanges ? '✅ Yes' : '❌ No');

    // Check for markdown elements
    const hasBold = data.formatted.includes('**');
    const hasLists = data.formatted.includes('- ') || data.formatted.includes('1. ');
    const hasParagraphs = data.formatted.split('\n\n').length > 1;

    console.log('Markdown elements:');
    console.log('Bold text:', hasBold ? '✅ Found' : '❌ Not found');
    console.log('Lists:', hasLists ? '✅ Found' : '❌ Not found');
    console.log('Paragraphs:', hasParagraphs ? '✅ Found' : '❌ Not found');

    if (hasChanges) {
      console.log('\n🎉 SUCCESS: Enhanced AI formatting is working!');
    } else {
      console.log('\n⚠️  Text was not changed - might be already well-formatted');
    }

    console.log('\n✨ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAIFormat();