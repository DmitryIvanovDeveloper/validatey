// create-feature.cjs
// Minimal scaffolder for features per app-docs(v.6.1). Creates directories and placeholder files.

const fs = require('fs');
const path = require('path');
const { findProjectRoot } = require('../../../app-docs(v.6.1)/scripts/path-utils.js');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeIfMissing(filePath, content) {
  if (!fs.existsSync(filePath)) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('✅ Created:', filePath);
  } else {
    console.log('♻️ Exists:', filePath);
  }
}

function main() {
  const args = process.argv.slice(2);
  const featureArg = args.find(a => a.startsWith('--feature='));
  const moduleArg = args.find(a => a.startsWith('--module='));

  if (!featureArg || !moduleArg) {
    console.error('Usage: node scripts/create-feature.cjs --feature=<name> --module=<module>');
    process.exit(1);
  }

  const feature = featureArg.split('=')[1];
  const moduleName = moduleArg.split('=')[1];

  const projectRoot = findProjectRoot(__dirname);
  if (!projectRoot) {
    console.error('❌ Cannot detect project root (package.json not found).');
    process.exit(1);
  }

  console.log('📁 Project root:', projectRoot);

  const srcPath = path.join(projectRoot, 'src');
  const modulePath = path.join(srcPath, 'modules', moduleName);
  const appPath = path.join(modulePath, 'application');

  const paths = {
    models: path.join(appPath, 'models'),
    ports: path.join(appPath, 'ports'),
    useCases: path.join(appPath, 'use-cases'),
    presenters: path.join(modulePath, 'interface-adapters', 'presenters'),
    views: path.join(modulePath, 'interface-adapters', 'views'),
  };

  Object.values(paths).forEach(ensureDir);

  // Feature-specific filenames
  const ucFile = path.join(paths.useCases, `${feature}.use-case.ts`);
  const ioFile = path.join(paths.models, `${feature}.io.ts`);
  const presenterFile = path.join(paths.presenters, `${feature}.presenter.ts`);

  writeIfMissing(ioFile, `// ${feature}.io.ts\nexport interface ${toPascal(feature)}Input {\n}\n\nexport interface ${toPascal(feature)}Output {\n}\n`);

  writeIfMissing(ucFile, `// ${feature}.use-case.ts\nimport { injectable } from 'inversify';\nimport Result from '../../../../infrastructure/result/result';\nimport type { ${toPascal(feature)}Input, ${toPascal(feature)}Output } from '../models/${feature}.io';\n\n@injectable()\nexport class ${toPascal(feature)}UseCase {\n  public async execute(input: ${toPascal(feature)}Input): Promise<Result<${toPascal(feature)}Output>> {\n    // TODO: implement\n    return Result.failure(new Error('Not implemented'));\n  }\n}\n`);

  writeIfMissing(presenterFile, `// ${feature}.presenter.ts\nimport { injectable } from 'inversify';\n\n@injectable()\nexport class ${toPascal(feature)}Presenter {\n}\n`);

  console.log('✅ Feature scaffolding completed');
}

function toPascal(kebab) {
  return kebab
    .split(/[-_]/)
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

main();
