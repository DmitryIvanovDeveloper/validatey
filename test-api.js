const fetch = require('node-fetch');

async function testAPI() {
  const projectId = '45564922-5f14-418d-ab87-08d3dc2ebf44';
  const baseUrl = 'http://localhost:4000';

  try {
    console.log('Testing API...');

    // 1. Create a Reddit source
    console.log('Creating Reddit source...');
    const createSourceResponse = await fetch(`${baseUrl}/projects/${projectId}/comments/sources`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceType: 'reddit',
        redditUrl: 'https://reddit.com/r/startup'
      })
    });

    const sourceResult = await createSourceResponse.json();
    console.log('Create source result:', sourceResult);

    if (sourceResult.source) {
      const sourceId = sourceResult.source.id;

      // 2. Fetch comments for this source
      console.log('Fetching comments...');
      const fetchResponse = await fetch(`${baseUrl}/projects/${projectId}/comments/fetch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: 'reddit',
          redditUrls: ['https://reddit.com/r/startup'],
          periodDays: 1
        })
      });

      const fetchResult = await fetchResponse.json();
      console.log('Fetch result:', fetchResult);

      // 3. Get comments with URL filter
      console.log('Getting comments with URL filter...');
      const commentsResponse = await fetch(`${baseUrl}/projects/${projectId}/comments?url=https://reddit.com/r/startup`);
      const commentsResult = await commentsResponse.json();
      console.log('Comments with URL filter:', commentsResult);

      // 4. Get all comments (without filter)
      console.log('Getting all comments...');
      const allCommentsResponse = await fetch(`${baseUrl}/projects/${projectId}/comments`);
      const allCommentsResult = await allCommentsResponse.json();
      console.log('All comments:', allCommentsResult);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();