// Test HN API directly
const axios = require('axios');

async function testHnApi() {
  try {
    // Test HN API directly
    const hnResponse = await axios.get('https://hacker-news.firebaseio.com/v0/item/46966201.json');
    console.log('HN API Response:', {
      id: hnResponse.data.id,
      title: hnResponse.data.title,
      type: hnResponse.data.type,
      kidsCount: hnResponse.data.kids?.length || 0
    });

    // Test our backend API
    const backendResponse = await axios.post('http://localhost:8080/api/projects/test/comments/fetch', {
      sourceType: 'hackernews',
      hnUrls: ['https://news.ycombinator.com/item?id=46966201']
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Backend Response:', backendResponse.data);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testHnApi();