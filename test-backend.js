// Test backend directly
const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend HN fetch...');

    const response = await axios.post('http://localhost:8080/api/projects/test/comments/fetch', {
      sourceType: 'hackernews',
      hnUrls: ['https://news.ycombinator.com/item?id=46966201']
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Backend response:', response.data);

    // Check database
    const dbResponse = await axios.get('http://localhost:8080/api/projects/test/comments');
    console.log('Comments in DB:', dbResponse.data.comments.length);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testBackend();