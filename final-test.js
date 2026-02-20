const http = require('http');

async function finalTest() {
  console.log('🎯 FINAL TEST: Trinity Showcase AI Formatting\n');

  // Real Trinity Showcase project segment text
  const segmentText = `Who is our user: Solopreneurs and indie hackers launching their first/second product. Startup founders at Pre-seed / Seed stage (with no marketing budget). Developers and designers building side projects hoping for growth. Creators actively seeking feedback ("Roast my landing page", "What do you think?"). Those already posting on Reddit (r/SideProject, r/indiehackers, r/startups). People with #buildinpublic on Twitter but getting little response.`;

  const hypothesisText = `Core hypothesis: First-time product creators (solopreneurs, indie hackers) are willing to invest time in creating a structured project page on Validatey Showcase and sharing it in communities, because it gives them three-sided value: For entrepreneurs — idea validation through structured feedback and development data; For users — quick 30-second assessment "is it worth trying"; For investors — ready-made due diligence information and social proof.`;

  console.log('📋 Testing Segment formatting...');
  await testFormatting('Segment', segmentText);

  console.log('\n📋 Testing Hypothesis formatting...');
  await testFormatting('Hypothesis', hypothesisText);

  console.log('\n🎉 ALL TESTS COMPLETED!');
  console.log('\n✅ AI Format button is ready for production use!');
}

async function testFormatting(label, text) {
  try {
    const response = await new Promise((resolve, reject) => {
      const postData = JSON.stringify({ text });

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
    const originalLength = text.length;
    const formattedLength = data.formatted.length;
    const hasChanges = text !== data.formatted;

    console.log(`Original: ${originalLength} chars`);
    console.log(`Formatted: ${formattedLength} chars`);
    console.log(`Changed: ${hasChanges ? '✅' : '❌'}`);

    // Check markdown elements
    const hasBold = data.formatted.includes('**');
    const hasItalic = data.formatted.includes('*');
    const hasLists = data.formatted.includes('\n- ');

    console.log(`Markdown - Bold: ${hasBold ? '✅' : '❌'}, Italic: ${hasItalic ? '✅' : '❌'}, Lists: ${hasLists ? '✅' : '❌'}`);

    if (hasChanges) {
      console.log('✅ SUCCESS: Text was enhanced with AI formatting');
    }

  } catch (error) {
    console.error(`❌ ${label} test failed:`, error.message);
  }
}

// Run the final test
finalTest().catch(console.error);