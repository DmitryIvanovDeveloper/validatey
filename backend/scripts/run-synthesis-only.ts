/**
 * Run synthesis only (no collect). Use when comments already exist and cooldown blocks collect.
 * Usage: npx ts-node scripts/run-synthesis-only.ts [projectId]
 */
import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import 'reflect-metadata';
import '../src/infrastructure/bootstrap/container';
import { container } from '../src/infrastructure/bootstrap/container';
import { TYPES } from '../src/modules/research/infrastructure/bootstrap/types';
import { GenerateSynthesisUseCase } from '../src/modules/research/application/use-cases/generate-synthesis.use-case';

async function main() {
  const projectId = process.argv[2];
  if (!projectId) {
    console.error('Usage: npx ts-node scripts/run-synthesis-only.ts <projectId>');
    process.exit(1);
  }
  console.log('Running synthesis only for projectId:', projectId);

  const synthesisUseCase = container.get<GenerateSynthesisUseCase>(TYPES.GenerateSynthesisUseCase);
  const synthesisResult = await synthesisUseCase.execute({ projectId });
  if (!synthesisResult.isSuccess) {
    console.error('Synthesis failed:', synthesisResult.error?.message);
    process.exit(1);
  }
  const report = synthesisResult.data?.report;
  const patterns = report?.commentPatternAnalysis?.patterns ?? [];
  console.log('Synthesis OK. Verdict:', report?.verdict);
  console.log('Patterns and comment counts:');
  for (const p of patterns) {
    console.log(`  ${p.type}: ${p.label} — ${p.count ?? (p.commentIds?.length ?? 0)} comments`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
