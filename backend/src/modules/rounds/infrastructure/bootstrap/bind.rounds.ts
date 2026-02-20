import { Container } from 'inversify';
import { TYPES } from './types';
import { RoundRepositoryPort } from '../../application/ports/round-repository.port';
import { SupabaseRoundRepository } from '../repositories/supabase-round.repository';
import { CreateRoundUseCase } from '../../application/use-cases/create-round.use-case';
import { ListRoundsByProjectUseCase } from '../../application/use-cases/list-rounds-by-project.use-case';
import { GetRoundUseCase } from '../../application/use-cases/get-round.use-case';
import { UpdateRoundUseCase } from '../../application/use-cases/update-round.use-case';
import { DeleteRoundUseCase } from '../../application/use-cases/delete-round.use-case';
import { RoundController } from '../../interface-adapters/controllers/round.controller';
import { RoundSynthesisOrchestratorAdapter } from '../adapters/round-synthesis-orchestrator.adapter';

export function bindRounds(container: Container): void {
  container.bind<RoundRepositoryPort>(TYPES.RoundRepository).to(SupabaseRoundRepository);
  container.bind<CreateRoundUseCase>(TYPES.CreateRoundUseCase).to(CreateRoundUseCase);
  container.bind<ListRoundsByProjectUseCase>(TYPES.ListRoundsByProjectUseCase).to(ListRoundsByProjectUseCase);
  container.bind<GetRoundUseCase>(TYPES.GetRoundUseCase).to(GetRoundUseCase);
  container.bind<UpdateRoundUseCase>(TYPES.UpdateRoundUseCase).to(UpdateRoundUseCase);
  container.bind<DeleteRoundUseCase>(TYPES.DeleteRoundUseCase).to(DeleteRoundUseCase);
  container.bind<RoundController>(TYPES.RoundController).to(RoundController);
  container.bind<RoundSynthesisOrchestratorAdapter>(TYPES.RoundSynthesisOrchestrator).to(RoundSynthesisOrchestratorAdapter);
}
