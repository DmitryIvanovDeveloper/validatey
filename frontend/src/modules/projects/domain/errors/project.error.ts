export abstract class ProjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProjectError';
  }
}

export class ProjectNotFoundError extends ProjectError {
  constructor(projectId: string) {
    super(`Project with id ${projectId} not found`);
    this.name = 'ProjectNotFoundError';
  }
}

export class InvalidProjectDataError extends ProjectError {
  constructor(message: string) {
    super(`Invalid project data: ${message}`);
    this.name = 'InvalidProjectDataError';
  }
}

