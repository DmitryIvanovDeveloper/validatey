import { Container } from "inversify";
import { TYPES } from "./types";
import { SupabaseEarlySignalsQueryRepository } from "../repositories/supabase-early-signals-query.repository";
import { GetEarlySignalsByProjectIdUseCase } from "../../application/use-cases/get-early-signals-by-project-id.use-case";
import { EarlySignalsController } from "../../interface-adapters/controllers/early-signals.controller";

export function bindSignals(container: Container): void {
  container.bind(TYPES.EarlySignalsQueryRepository).toConstantValue(new SupabaseEarlySignalsQueryRepository());
  container
    .bind(TYPES.GetEarlySignalsByProjectIdUseCase)
    .toConstantValue(new GetEarlySignalsByProjectIdUseCase(container.get(TYPES.EarlySignalsQueryRepository)));
  container
    .bind(TYPES.EarlySignalsController)
    .toConstantValue(new EarlySignalsController(container.get(TYPES.GetEarlySignalsByProjectIdUseCase)));
}
