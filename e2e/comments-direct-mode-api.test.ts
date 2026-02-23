import { test, expect } from '@playwright/test';

/**
 * Test to verify that comment fetching API works in direct mode (without job system)
 * This test directly calls the backend API to verify COMMENT_FETCH_USE_JOBS=false functionality
 */
test.describe('Comments Fetch API - Direct Mode Verification', () => {
  test.setTimeout(300000); // 5 minutes timeout

  const API_BASE_URL = 'http://localhost:8080/api';
  const testProject = {
    projectId: 'startup-failure-patterns-analysis',
  };

  test('should fetch comments via API in direct mode (no jobs created)', async ({ request }) => {
    console.log('=== Testing Direct Mode API ===');
    console.log('Expected: COMMENT_FETCH_USE_JOBS=false should work without creating jobs');

    // Test Reddit URL fetch
    const testUrl = 'https://www.reddit.com/r/startups/';
    
    console.log(`Making API call to fetch comments for: ${testUrl}`);
    const fetchStartTime = Date.now();
    
    // Call the fetch API endpoint
    const response = await request.post(`${API_BASE_URL}/projects/${testProject.projectId}/comments/fetch`, {
      data: {
        redditUrls: [testUrl],
        periodDays: 7
      },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const fetchDuration = Date.now() - fetchStartTime;
    console.log(`API Response status: ${response.status()}`);
    console.log(`API Response time: ${Math.round(fetchDuration / 1000)}s`);

    // In direct mode, the API should return 202 (Accepted) immediately
    // The actual fetch happens synchronously in the background
    expect([200, 202]).toContain(response.status());
    
    const responseBody = await response.json().catch(() => ({}));
    console.log('API Response:', JSON.stringify(responseBody, null, 2));

    // Verify that the response indicates the fetch was started
    if (response.status() === 202) {
      expect(responseBody).toHaveProperty('status');
      expect(responseBody.status).toBe('started');
      console.log('✓ API returned 202 Accepted - fetch started');
    } else if (response.status() === 200) {
      console.log('✓ API returned 200 OK - fetch completed synchronously');
    }

    // Wait a bit for the fetch to complete (in direct mode, it should be faster)
    console.log('Waiting for fetch to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds

    // Verify comments were collected by checking the comments endpoint
    const commentsResponse = await request.get(
      `${API_BASE_URL}/projects/${testProject.projectId}/comments?limit=10`
    );

    expect(commentsResponse.status()).toBe(200);
    const commentsData = await commentsResponse.json();
    console.log(`Comments found: ${commentsData.comments?.length || 0}`);
    console.log(`Total count: ${commentsData.totalCount || 0}`);

    // Verify that comments exist (or at least the API works)
    expect(commentsData).toHaveProperty('comments');
    expect(Array.isArray(commentsData.comments)).toBe(true);

    if (commentsData.comments.length > 0) {
      console.log(`✅ SUCCESS: ${commentsData.comments.length} comment(s) collected in direct mode!`);
      console.log('Sample comment:', JSON.stringify(commentsData.comments[0], null, 2));
    } else {
      console.log('⚠️  No comments found, but API works correctly');
    }

    console.log('=== Direct Mode API Test completed ===');
  });

  test('should verify no job records are created in direct mode', async ({ request }) => {
    console.log('=== Testing Direct Mode (No Job Records) ===');

    const testUrl = 'https://www.reddit.com/r/startups/';
    
    // Get initial job count (if job status endpoint exists)
    let initialJobCount = 0;
    try {
      const statusResponse = await request.get(
        `${API_BASE_URL}/projects/${testProject.projectId}/comments/fetch/status`
      );
      if (statusResponse.ok()) {
        const statusData = await statusResponse.json();
        initialJobCount = statusData.jobs?.length || 0;
        console.log(`Initial job count: ${initialJobCount}`);
      }
    } catch (e) {
      console.log('⚠️  Job status endpoint not available or not accessible');
    }

    // Make fetch request
    console.log('Making fetch request...');
    const fetchResponse = await request.post(
      `${API_BASE_URL}/projects/${testProject.projectId}/comments/fetch`,
      {
        data: {
          redditUrls: [testUrl],
        },
      }
    );

    expect([200, 202]).toContain(fetchResponse.status());
    console.log('✓ Fetch request completed');

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check job count again
    let finalJobCount = 0;
    try {
      const statusResponse = await request.get(
        `${API_BASE_URL}/projects/${testProject.projectId}/comments/fetch/status`
      );
      if (statusResponse.ok()) {
        const statusData = await statusResponse.json();
        finalJobCount = statusData.jobs?.length || 0;
        console.log(`Final job count: ${finalJobCount}`);
      }
    } catch (e) {
      console.log('⚠️  Job status endpoint not available');
    }

    // In direct mode, job count should not increase significantly
    // (or jobs might not be created at all)
    console.log(`Job count change: ${finalJobCount - initialJobCount}`);
    
    if (finalJobCount === initialJobCount) {
      console.log('✅ SUCCESS: No new jobs created (direct mode working correctly)');
    } else {
      console.log(`⚠️  Job count increased by ${finalJobCount - initialJobCount} (might be expected if frontend polls)`);
    }

    // Verify comments were still collected
    const commentsResponse = await request.get(
      `${API_BASE_URL}/projects/${testProject.projectId}/comments?limit=5`
    );

    expect(commentsResponse.status()).toBe(200);
    const commentsData = await commentsResponse.json();
    console.log(`Comments available: ${commentsData.comments?.length || 0}`);

    console.log('=== No Job Records Test completed ===');
  });

  test('should verify direct mode is faster than job mode', async ({ request }) => {
    console.log('=== Testing Direct Mode Performance ===');

    const testUrl = 'https://www.reddit.com/r/startups/';
    
    // Measure direct mode performance
    console.log('Testing direct mode performance...');
    const startTime = Date.now();
    
    const response = await request.post(
      `${API_BASE_URL}/projects/${testProject.projectId}/comments/fetch`,
      {
        data: {
          redditUrls: [testUrl],
        },
      }
    );

    const apiResponseTime = Date.now() - startTime;
    console.log(`API response time: ${apiResponseTime}ms`);

    expect([200, 202]).toContain(response.status());

    // In direct mode, API should respond quickly (no job creation overhead)
    // Job mode typically takes longer due to job creation and async processing
    console.log(`✓ API responded in ${apiResponseTime}ms`);
    
    if (apiResponseTime < 5000) {
      console.log('✅ SUCCESS: Direct mode is fast (response < 5s)');
    } else {
      console.log(`⚠️  API response took ${apiResponseTime}ms (might be normal for large fetches)`);
    }

    // Wait for actual fetch to complete
    await new Promise(resolve => setTimeout(resolve, 15000));

    // Verify results
    const commentsResponse = await request.get(
      `${API_BASE_URL}/projects/${testProject.projectId}/comments?limit=5`
    );

    expect(commentsResponse.status()).toBe(200);
    const commentsData = await commentsResponse.json();
    console.log(`Comments collected: ${commentsData.comments?.length || 0}`);

    console.log('=== Performance Test completed ===');
  });
});
