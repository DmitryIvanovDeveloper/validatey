export class ResearchError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ResearchError';
  }
}

export class ResearchNotFoundError extends ResearchError {
  constructor(projectId: string) {
    super(`Research not found for project ${projectId}`);
    this.name = 'ResearchNotFoundError';
  }
}

export class ResearchDataCollectionError extends ResearchError {
  constructor(message: string) {
    super(message);
    this.name = 'ResearchDataCollectionError';
  }
}

export class SynthesisGenerationError extends ResearchError {
  constructor(message: string) {
    super(message);
    this.name = 'SynthesisGenerationError';
  }
}
