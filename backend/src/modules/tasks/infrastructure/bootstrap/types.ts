export const TYPES = {
  TaskRepository: Symbol.for('TaskRepository'),
  TaskQueue: Symbol.for('TaskQueue'),
  CreateTaskUseCase: Symbol.for('CreateTaskUseCase'),
  ScenarioGenerationWorker: Symbol.for('ScenarioGenerationWorker'),
  InvitationSenderWorker: Symbol.for('InvitationSenderWorker'),
  ResponseProcessorWorker: Symbol.for('ResponseProcessorWorker'),
  ReportBuilderWorker: Symbol.for('ReportBuilderWorker'),
  TaskPresenter: Symbol.for('TaskPresenter'),
} as const;



