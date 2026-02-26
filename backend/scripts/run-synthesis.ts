/**
 * One-off script: run research synthesis (and assumption assessments) for a project.
 * Usage: npx ts-node scripts/run-synthesis.ts [projectId]
 *        npx ts-node scripts/run-synthesis.ts "Give-to-Get Hypothesis"  (finds by name)
 */
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import 'reflect-metadata';
import '../src/infrastructure/bootstrap/container';
import { container } from '../src/infrastructure/bootstrap/container';
import { TYPES } from '../src/modules/research/infrastructure/bootstrap/types';
import { GenerateSynthesisUseCase } from '../src/modules/research/application/use-cases/generate-synthesis.use-case';

const PROJECT_ID_GIVE_TO_GET = 'f9e731bc-3414-4f82-8150-61550cf2abc8';

async function main() {
  const projectId = process.argv[2] || PROJECT_ID_GIVE_TO_GET;
  console.log('Running synthesis for projectId:', projectId);
  const useCase = container.get<GenerateSynthesisUseCase>(TYPES.GenerateSynthesisUseCase);
  const result = await useCase.execute({ projectId });
  if (result.isSuccess) {
    console.log('Synthesis completed. Verdict:', result.data?.verdict);
    console.log('Summary (first 300 chars):', result.data?.summary?.slice(0, 300));
  } else {
    console.error('Synthesis failed:', result.error?.message);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
