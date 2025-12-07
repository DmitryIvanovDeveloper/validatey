import { Container } from 'inversify';
import { TYPES } from './types';
import { TaskRepositoryPort } from '../../application/ports/task-repository.port';
import { SupabaseTaskRepository } from '../repositories/supabase-task.repository';
import { TaskQueuePort } from '../../application/ports/task-queue.port';
import { SupabaseRealtimeQueueService } from '../services/supabase-realtime-queue.service';
import { CreateTaskUseCase } from '../../application/use-cases/create-task.use-case';
import { ScenarioGenerationWorker } from '../workers/scenario-generation.worker';
import { InvitationSenderWorker } from '../workers/invitation-sender.worker';
import { ResponseProcessorWorker } from '../workers/response-processor.worker';
import { ReportBuilderWorker } from '../workers/report-builder.worker';
import { TaskPresenter } from '../../interface-adapters/presenters/task.presenter';

export function bindTasks(container: Container): void {
  // Repository
  container.bind<TaskRepositoryPort>(TYPES.TaskRepository).to(SupabaseTaskRepository);

  // Queue
  container.bind<TaskQueuePort>(TYPES.TaskQueue).to(SupabaseRealtimeQueueService).inSingletonScope();

  // Use Cases
  container.bind<CreateTaskUseCase>(TYPES.CreateTaskUseCase).to(CreateTaskUseCase);

  // Workers
  container.bind<ScenarioGenerationWorker>(TYPES.ScenarioGenerationWorker).to(ScenarioGenerationWorker);
  container.bind<InvitationSenderWorker>(TYPES.InvitationSenderWorker).to(InvitationSenderWorker);
  container.bind<ResponseProcessorWorker>(TYPES.ResponseProcessorWorker).to(ResponseProcessorWorker);
  container.bind<ReportBuilderWorker>(TYPES.ReportBuilderWorker).to(ReportBuilderWorker);

  // Presenter
  container.bind<TaskPresenter>(TYPES.TaskPresenter).to(TaskPresenter);
}


