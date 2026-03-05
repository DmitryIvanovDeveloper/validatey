import { LandingSlug } from '../value-objects/landing-slug.vo';

export interface LandingSlugGeneratorService {
  generateSlug(projectName: string, projectId: string): LandingSlug;
}

export class DefaultLandingSlugGeneratorService implements LandingSlugGeneratorService {
  generateSlug(projectName: string, projectId: string): LandingSlug {
    // Create base slug from project name
    let baseSlug = projectName
      .toLowerCase()
      .trim()
      // Replace spaces and special chars with hyphens
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // If base slug is too short or empty, use project id prefix
    if (baseSlug.length < 3) {
      baseSlug = `project-${projectId.slice(0, 8)}`;
    }

    // Ensure minimum length and valid format
    if (baseSlug.length < 3) {
      baseSlug = baseSlug.padEnd(3, 'x');
    }

    // Truncate if too long
    if (baseSlug.length > 50) {
      baseSlug = baseSlug.slice(0, 47) + '...';
    }

    return LandingSlug.create(baseSlug);
  }
}