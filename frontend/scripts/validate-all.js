const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Running Full Validation Suite...\n');

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

  console.log('2. Running ESLint...');
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ ESLint check passed\n');

  console.log('3. Running tests...');
  execSync('npm run test:run', { stdio: 'inherit' });
  console.log('✅ Tests passed\n');

  console.log('4. Running Quality Monitor...');
  execSync('node scripts/quality-monitor.js', { stdio: 'inherit' });
  console.log('✅ Quality Monitor passed\n');

  console.log('🎉 All validations passed! Project is ready for development.');

} catch (error) {
  console.error('❌ Validation failed:', error.message);
  process.exit(1);
}
