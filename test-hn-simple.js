// Simple test of HN API
const https = require('https');

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function test() {
  try {
    console.log('Testing HN API...');

    // Get story
    const story = await getJson('https://hacker-news.firebaseio.com/v0/item/46966201.json');
    console.log('Story:', {
      id: story.id,
      title: story.title,
      type: story.type,
      kids: story.kids?.length || 0
    });

    // Get comments
    if (story.kids && story.kids.length > 0) {
      for (const commentId of story.kids.slice(0, 3)) {
        const comment = await getJson(`https://hacker-news.firebaseio.com/v0/item/${commentId}.json`);
        console.log('Comment:', {
          id: comment.id,
          type: comment.type,
          by: comment.by,
          textLength: comment.text?.length || 0,
          hasKids: comment.kids?.length > 0
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();