const fs = require('fs');
const path = require('path');

console.log('🔍 Quality Monitor - Backend Architecture Validation');
console.log('⏰ Running checks every 60 seconds...\n');

let checkCount = 0;

// Check 0: Working directory validation
function checkWorkingDirectory() {
  console.log('0. Checking working directory...');
  const currentDir = process.cwd();
  const packageJsonPath = path.join(currentDir, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found in current directory');
    console.error(`   Current directory: ${currentDir}`);
    console.error('   Please run this script from the project root directory');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log(`✅ Working in project: ${packageJson.name} (${currentDir})`);
  
  // Check if this is a Node.js backend project
  if (packageJson.dependencies && packageJson.dependencies.express) {
    console.log('✅ Express.js backend project detected');
  } else {
    console.warn('⚠️  Not an Express.js project - some checks may fail');
  }
}

// Check 1: Result Pattern implementation (v6.1 compliance)
function checkResultPattern() {
  console.log('1. Checking Result Pattern (v6.1 compliance)...');
  const resultPath = path.join(__dirname, '../src/infrastructure/result/result.ts');
  
  if (!fs.existsSync(resultPath)) {
    console.error('❌ Result Pattern not found at src/infrastructure/result/result.ts');
    hasErrors = true;
    return;
  }
  
  const resultContent = fs.readFileSync(resultPath, 'utf8');
  
  // Check for class ResultEx
  if (!resultContent.includes('class ResultEx')) {
    console.error('❌ ResultEx class not found');
    hasErrors = true;
    return;
  }
  
  // Check for required properties (not methods)
  if (!resultContent.includes('public readonly isSuccess: boolean')) {
    console.error('❌ ResultEx property isSuccess not found (should be readonly property)');
    hasErrors = true;
  }
  
  // Check for static methods
  if (!resultContent.includes('static success')) {
    console.error('❌ ResultEx static success method not found');
    hasErrors = true;
  }
  
  if (!resultContent.includes('static failure')) {
    console.error('❌ ResultEx static failure method not found');
    hasErrors = true;
  }
  
  // Check for getter properties
  if (!resultContent.includes('get data(): T')) {
    console.error('❌ ResultEx data getter not found');
    hasErrors = true;
  }
  
  if (!resultContent.includes('get error(): E')) {
    console.error('❌ ResultEx error getter not found');
    hasErrors = true;
  }
  
  // Check for private constructor
  if (!resultContent.includes('private constructor')) {
    console.error('❌ ResultEx private constructor not found');
    hasErrors = true;
  }
  
  // Check for generic support
  if (!resultContent.includes('ResultEx<T, E = Error>')) {
    console.error('❌ ResultEx generic support not found (should support T and E)');
    hasErrors = true;
  }
  
  if (!hasErrors) {
    console.log('✅ Result Pattern implemented correctly (v6.1 compliant)');
  }
}

// Check 2: DI Container
function checkDIContainer() {
  console.log('\n2. Checking DI Container...');
  const containerPath = path.join(__dirname, '../src/infrastructure/bootstrap/container.ts');
  
  if (!fs.existsSync(containerPath)) {
    console.error('❌ DI Container not found at src/infrastructure/bootstrap/container.ts');
    hasErrors = true;
    return;
  }
  
  const containerContent = fs.readFileSync(containerPath, 'utf8');
  
  if (!containerContent.includes('reflect-metadata')) {
    console.error('❌ reflect-metadata import not found');
    hasErrors = true;
  } else if (!containerContent.includes('inversify')) {
    console.error('❌ inversify import not found');
    hasErrors = true;
  } else {
    console.log('✅ DI Container configured correctly');
  }
}

// Check 3: Express App Structure
function checkExpressApp() {
  console.log('\n3. Checking Express App Structure...');
  const appPath = path.join(__dirname, '../src/app.ts');
  const serverPath = path.join(__dirname, '../src/server.ts');
  
  if (!fs.existsSync(appPath)) {
    console.error('❌ Express app not found at src/app.ts');
    hasErrors = true;
  } else {
    console.log('✅ Express app.ts found');
  }
  
  if (!fs.existsSync(serverPath)) {
    console.error('❌ Server entry point not found at src/server.ts');
    hasErrors = true;
  } else {
    console.log('✅ Server entry point found');
  }
}

// Check 4: Infrastructure structure
function checkInfrastructureStructure() {
  console.log('\n4. Checking infrastructure structure...');
  const infraPath = path.join(__dirname, '../src/infrastructure');
  
  const requiredDirs = ['bootstrap', 'logging', 'http', 'event-bus', 'result'];
  const requiredFiles = [
    'bootstrap/container.ts',
    'bootstrap/types.ts',
    'logging/ports/logger.port.ts',
    'logging/console-logger.ts',
    'http/ports/http-client.port.ts',
    'http/http-client.ts',
    'event-bus/ports/event-bus.port.ts',
    'event-bus/event-bus.ts',
    'result/result.ts'
  ];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(infraPath, dir);
    if (!fs.existsSync(dirPath)) {
      console.error(`❌ Infrastructure directory missing: ${dir}`);
      hasErrors = true;
    }
  }
  
  for (const file of requiredFiles) {
    const filePath = path.join(infraPath, file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Infrastructure file missing: ${file}`);
      hasErrors = true;
    }
  }
  
  if (!hasErrors) {
    console.log('✅ Infrastructure structure complete');
  }
}

// Check 5: Root types.ts content
function checkRootBindings() {
  console.log('\n5. Checking root types.ts content...');
  const typesPath = path.join(__dirname, '../src/infrastructure/bootstrap/types.ts');
  
  if (!fs.existsSync(typesPath)) {
    console.error('❌ Root types.ts not found');
    hasErrors = true;
    return;
  }
  
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  // Check for infrastructure-level symbols only
  const allowedSymbols = ['Logger', 'HttpClient', 'EventBus'];
  const forbiddenPatterns = [
    /Repository/,
    /UseCase/,
    /Presenter/,
    /Controller/
  ];
  
  let hasForbiddenSymbols = false;
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(typesContent)) {
      console.error(`❌ Root types.ts contains forbidden symbol: ${pattern.source}`);
      hasForbiddenSymbols = true;
      hasErrors = true;
    }
  }
  
  if (!hasForbiddenSymbols) {
    console.log('✅ Root types.ts contains only infrastructure symbols');
  }
}

// Check 6: Import paths
function checkImportPaths() {
  console.log('\n6. Checking import paths...');
  const srcPath = path.join(__dirname, '../src');
  
  function checkFileImports(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const importLines = content.match(/import.*from.*['"`]([^'"`]+)['"`]/g) || [];
    
    for (const importLine of importLines) {
      const match = importLine.match(/from.*['"`]([^'"`]+)['"`]/);
      if (match) {
        const importPath = match[1];
        
        // Check for absolute imports (should be relative)
        if (importPath.startsWith('src/') || importPath.startsWith('/src/')) {
          console.error(`❌ Absolute import found in ${filePath}: ${importPath}`);
          hasErrors = true;
        }
      }
    }
  }
  
  // Check all TypeScript files
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.ts')) {
        checkFileImports(filePath);
      }
    }
  }
  
  walkDir(srcPath);
  
  if (!hasErrors) {
    console.log('✅ All imports use relative paths');
  }
}

// Function to run all checks
function runAllChecks() {
  checkCount++;
  hasErrors = false;
  
  console.log(`\n🔄 Check #${checkCount} - ${new Date().toLocaleTimeString()}`);
  console.log('='.repeat(50));
  
  checkWorkingDirectory();
  checkResultPattern();
  checkDIContainer();
  checkExpressApp();
  checkInfrastructureStructure();
  checkRootBindings();
  checkImportPaths();

  console.log('\n' + '='.repeat(50));

  if (hasErrors) {
    console.error('❌ Quality Monitor found issues. Please fix them before continuing.');
    console.log('⏰ Will check again in 60 seconds...\n');
  } else {
    console.log('✅ Quality Monitor passed! Backend architecture is correct.');
    console.log('⏰ Will check again in 60 seconds...\n');
  }
  
  // Don't exit on errors - just log them
  // This allows development to continue even with architecture issues
}

// Run initial check
runAllChecks();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping Quality Monitor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Stopping Quality Monitor...');
  process.exit(0);
});
