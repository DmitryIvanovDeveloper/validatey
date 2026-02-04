export const TYPES = {
  ConsentRepository: Symbol.for('ConsentRepository'),
  ConsentRequirements: Symbol.for('ConsentRequirements'),
  RecordConsentUseCase: Symbol.for('RecordConsentUseCase'),
  GetConsentRequirementsUseCase: Symbol.for('GetConsentRequirementsUseCase'),
  ExportConsentsUseCase: Symbol.for('ExportConsentsUseCase'),
  ConsentPresenter: Symbol.for('ConsentPresenter'),
} as const;
