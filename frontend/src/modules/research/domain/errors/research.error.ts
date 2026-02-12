export class ResearchNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Research data not found for project ${projectId}`);
    this.name = 'ResearchNotFoundError';
  }
}

export class ResearchCollectError extends Error {
  constructor(message: string) {
    super(`Failed to collect research data: ${message}`);
    this.name = 'ResearchCollectError';
  }
}

export class ResearchSynthesisError extends Error {
  constructor(message: string) {
    super(`Failed to generate synthesis: ${message}`);
    this.name = 'ResearchSynthesisError';
  }
}