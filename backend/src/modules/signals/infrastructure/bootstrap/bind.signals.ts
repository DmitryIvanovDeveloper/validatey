import { Container } from 'inversify';
import { TYPES } from './types';
import { EarlySignalsLlmPort } from '../../application/ports/early-signals-llm.port';
import { EarlySignalsRepositoryPort } from '../../application/ports/early-signals-repository.port';
import { GetEarlySignalsByProjectIdUseCase } from '../../application/use-cases/get-early-signals-by-project-id.use-case';
import { EarlySignalsLlmAdapter } from '../services/early-signals-llm.adapter';
import { SupabaseEarlySignalsRepository } from '../repositories/supabase-early-signals.repository';
import { EarlySignalsController } from '../../interface-adapters/controllers/early-signals.controller';

export function bindSignals(container: Container): void {
  container.bind<EarlySignalsLlmPort>(TYPES.EarlySignalsLlm).to(EarlySignalsLlmAdapter);
  container.bind<EarlySignalsRepositoryPort>(TYPES.EarlySignalsRepository).to(SupabaseEarlySignalsRepository);
  container.bind<GetEarlySignalsByProjectIdUseCase>(TYPES.GetEarlySignalsByProjectIdUseCase).to(GetEarlySignalsByProjectIdUseCase);
  container.bind<EarlySignalsController>(TYPES.EarlySignalsController).to(EarlySignalsController);
}
