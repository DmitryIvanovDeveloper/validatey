// Simple test for HN API
const axios = require('axios');

async function testHnApi() {
  try {
    const response = await axios.post('http://localhost:8080/api/projects/test-project-id/comments/fetch', {
      sourceType: 'hackernews',
      hnUrls: ['https://news.ycombinator.com/item?id=46966201']
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testHnApi();