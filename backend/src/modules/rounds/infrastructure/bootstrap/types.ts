export const TYPES = {
  RoundRepository: Symbol.for('RoundRepository'),
  CreateRoundUseCase: Symbol.for('CreateRoundUseCase'),
  ListRoundsByProjectUseCase: Symbol.for('ListRoundsByProjectUseCase'),
  GetRoundUseCase: Symbol.for('GetRoundUseCase'),
  UpdateRoundUseCase: Symbol.for('UpdateRoundUseCase'),
  DeleteRoundUseCase: Symbol.for('DeleteRoundUseCase'),
  RoundController: Symbol.for('RoundController'),
  RoundSynthesisOrchestrator: Symbol.for('RoundSynthesisOrchestrator'),
} as const;
