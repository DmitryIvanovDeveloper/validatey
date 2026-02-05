export class ProjectError extends Error {
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

export class ProjectAccessDeniedError extends ProjectError {
  constructor(projectId: string, userId: string) {
    super(`User ${userId} does not have access to project ${projectId}`);
    this.name = 'ProjectAccessDeniedError';
  }
}

export class PublicLinkNotEnabledError extends ProjectError {
  constructor(projectIdOrSlug: string) {
    super(`Public access is not enabled for project or slug: ${projectIdOrSlug}`);
    this.name = 'PublicLinkNotEnabledError';
  }
}

export class PublicSlugTakenError extends ProjectError {
  constructor(slug: string) {
    super(`Public slug already in use: ${slug}`);
    this.name = 'PublicSlugTakenError';
  }
}

export class MaxPublicResponsesReachedError extends ProjectError {
  constructor(projectId: string) {
    super(`Maximum public responses reached for project: ${projectId}`);
    this.name = 'MaxPublicResponsesReachedError';
  }
}



