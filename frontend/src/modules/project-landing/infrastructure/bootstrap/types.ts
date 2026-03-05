export const TYPES = {
  // Repositories
  ProjectLandingRepository: Symbol('ProjectLandingRepository'),

  // Use Cases
  UploadLandingUseCase: Symbol('UploadLandingUseCase'),
  GetProjectLandingUseCase: Symbol('GetProjectLandingUseCase'),
  DeleteLandingUseCase: Symbol('DeleteLandingUseCase'),

  // Presenters
  ProjectLandingPresenter: Symbol('ProjectLandingPresenter'),
} as const;