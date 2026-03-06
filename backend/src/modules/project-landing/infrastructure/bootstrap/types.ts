export const TYPES = {
  // Repositories
  ProjectLandingRepository: Symbol('ProjectLandingRepository'),

  // Services
  LandingFileStorage: Symbol('LandingFileStorage'),
  ArchiveExtractor: Symbol('ArchiveExtractor'),
  LandingSlugGenerator: Symbol('LandingSlugGenerator'),
  LandingGenerationLLM: Symbol('LandingGenerationLLM'),
  ZipArchiveCreator: Symbol('ZipArchiveCreator'),

  // Use Cases
  UploadLandingUseCase: Symbol('UploadLandingUseCase'),
  GetProjectLandingUseCase: Symbol('GetProjectLandingUseCase'),
  DeleteLandingUseCase: Symbol('DeleteLandingUseCase'),
  ServeLandingFileUseCase: Symbol('ServeLandingFileUseCase'),
  GenerateLandingUseCase: Symbol('GenerateLandingUseCase'),

  // Controllers
  ProjectLandingController: Symbol('ProjectLandingController'),
  PublicLandingController: Symbol('PublicLandingController'),
} as const;