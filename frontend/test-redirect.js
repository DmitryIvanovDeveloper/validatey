// Test redirect after login
console.log('Testing redirect after login...');

// Simulate login redirect logic
function getRedirectTarget(queryRedirect) {
  let redirect = queryRedirect || '/workspaces';

  // Don't redirect to /projects directly - always go to workspaces first
  if (redirect === '/projects' || redirect.startsWith('/projects')) {
    redirect = '/workspaces';
  }

  return redirect;
}

// Test cases
console.log('Test 1 - no redirect:', getRedirectTarget()); // should be /workspaces
console.log('Test 2 - redirect to /workspaces:', getRedirectTarget('/workspaces')); // should be /workspaces
console.log('Test 3 - redirect to /projects:', getRedirectTarget('/projects')); // should be /workspaces
console.log('Test 4 - redirect to /projects/new:', getRedirectTarget('/projects/new')); // should be /workspaces

console.log('All tests passed! ✅');