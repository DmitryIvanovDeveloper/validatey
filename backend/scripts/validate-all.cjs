const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running Full Backend Validation Suite...\n');

try {
  // Check working directory
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!require('fs').existsSync(packageJsonPath)) {
    console.error('❌ package.json not found - wrong directory');
    process.exit(1);
  }

  console.log('1. Running TypeScript type check...');
  execSync('npm run type-check', { stdio: 'inherit' });
  console.log('✅ TypeScript check passed\n');

  console.log('2. Running tests...');
  execSync('npm run test:run', { stdio: 'inherit' });
  console.log('✅ Tests passed\n');

  console.log('3. Running Quality Monitor...');
  execSync('node scripts/quality-monitor.cjs', { stdio: 'inherit' });
  console.log('✅ Quality Monitor passed\n');

  console.log('🎉 All validations passed! Backend is ready for development.');

} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
