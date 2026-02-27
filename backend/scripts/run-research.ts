/**
 * Run full research: collect data (with segment-aware search) then synthesis.
 * Usage: npx ts-node scripts/run-research.ts [projectId]
 */
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import 'reflect-metadata';
import '../src/infrastructure/bootstrap/container';
import { container } from '../src/infrastructure/bootstrap/container';
import { TYPES } from '../src/modules/research/infrastructure/bootstrap/types';
import { CollectResearchDataUseCase } from '../src/modules/research/application/use-cases/collect-research-data.use-case';
import { GenerateSynthesisUseCase } from '../src/modules/research/application/use-cases/generate-synthesis.use-case';

const PROJECT_ID_BRAINSTORM = 'ef526537-c0e7-43d4-8f6a-6a9f3f268bdb';

async function main() {
  const projectId = process.argv[2] || PROJECT_ID_BRAINSTORM;
  console.log('Running full research (collect + synthesis) for projectId:', projectId);

  const collectUseCase = container.get<CollectResearchDataUseCase>(TYPES.CollectResearchDataUseCase);
  const collectResult = await collectUseCase.execute({ projectId });
  if (!collectResult.isSuccess) {
    console.error('Collect failed:', collectResult.error?.message);
    process.exit(1);
  }
  console.log('Collect OK:', collectResult.data);

  const synthesisUseCase = container.get<GenerateSynthesisUseCase>(TYPES.GenerateSynthesisUseCase);
  const synthesisResult = await synthesisUseCase.execute({ projectId });
  if (!synthesisResult.isSuccess) {
    console.error('Synthesis failed:', synthesisResult.error?.message);
    process.exit(1);
  }
  const report = synthesisResult.data?.report;
  console.log('Synthesis OK. Verdict:', report?.verdict);
  console.log('Summary (first 300 chars):', report?.summary?.slice(0, 300));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
