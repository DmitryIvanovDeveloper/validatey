export const TYPES = {
  // Repositories
  ProjectLandingRepository: Symbol('ProjectLandingRepository'),

  // Services
  LandingFileStorage: Symbol('LandingFileStorage'),
  ArchiveExtractor: Symbol('ArchiveExtractor'),
  LandingSlugGenerator: Symbol('LandingSlugGenerator'),

  // Use Cases
  UploadLandingUseCase: Symbol('UploadLandingUseCase'),
  GetProjectLandingUseCase: Symbol('GetProjectLandingUseCase'),
  DeleteLandingUseCase: Symbol('DeleteLandingUseCase'),
  ServeLandingFileUseCase: Symbol('ServeLandingFileUseCase'),

  // Controllers
  ProjectLandingController: Symbol('ProjectLandingController'),
  PublicLandingController: Symbol('PublicLandingController'),
} as const;