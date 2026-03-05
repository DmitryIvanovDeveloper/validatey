import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';
import Result from '../../../../infrastructure/result/result';
import { ProjectLandingEntity } from '../../domain/entities/project-landing.entity';
import { LandingFileEntity } from '../../domain/entities/landing-file.entity';
import { LandingNotFoundError, LandingAlreadyExistsError } from '../../domain/errors/landing.error';
import { ProjectLandingRepositoryPort, CreateProjectLandingData, CreateLandingFileData } from '../../application/ports/project-landing-repository.port';

interface SupabaseProjectLanding {
  id: string;
  project_id: string;
  slug: string;
  archive_filename: string;
  uploaded_at: string;
  file_count: number;
  total_size_bytes: number;
}

interface SupabaseLandingFile {
  id: string;
  landing_id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
  storage_path: string;
  created_at: string;
}

@injectable()
export class SupabaseProjectLandingRepository implements ProjectLandingRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(data: CreateProjectLandingData): Promise<Result<ProjectLandingEntity, LandingAlreadyExistsError>> {
    try {
      // Check if project already has a landing
      const { data: existing, error: checkError } = await getSupabaseClient()
        .from('project_landings')
        .select('id')
        .eq('project_id', data.projectId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        return Result.failure(new LandingAlreadyExistsError(data.projectId));
      }

      if (existing) {
        return Result.failure(new LandingAlreadyExistsError(data.projectId));
      }

      // Create new landing
      const { data: landing, error } = await getSupabaseClient()
        .from('project_landings')
        .insert({
          project_id: data.projectId,
          slug: data.slug,
          archive_filename: data.archiveFilename,
          file_count: data.fileCount,
          total_size_bytes: data.totalSizeBytes,
        })
        .select()
        .single();

      if (error) {
        return Result.failure(new Error(`Failed to create landing: ${error.message}`));
      }

      const entity = ProjectLandingEntity.fromData({
        id: landing.id,
        projectId: landing.project_id,
        slug: landing.slug,
        archiveFilename: landing.archive_filename,
        uploadedAt: new Date(landing.uploaded_at),
        fileCount: landing.file_count,
        totalSizeBytes: landing.total_size_bytes,
      });

      return Result.success(entity);
    } catch (error) {
      return Result.failure(new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  async findByProjectId(projectId: string): Promise<Result<ProjectLandingEntity | null, never>> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('project_landings')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return Result.success(null);
        }
        return Result.success(null); // Return null on error to avoid breaking
      }

      const entity = ProjectLandingEntity.fromData({
        id: data.id,
        projectId: data.project_id,
        slug: data.slug,
        archiveFilename: data.archive_filename,
        uploadedAt: new Date(data.uploaded_at),
        fileCount: data.file_count,
        totalSizeBytes: data.total_size_bytes,
      });

      return Result.success(entity);
    } catch (error) {
      return Result.success(null); // Return null on error to avoid breaking
    }
  }

  async findBySlug(slug: string): Promise<Result<ProjectLandingEntity | null, never>> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('project_landings')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows returned
          return Result.success(null);
        }
        return Result.success(null); // Return null on error to avoid breaking
      }

      const entity = ProjectLandingEntity.fromData({
        id: data.id,
        projectId: data.project_id,
        slug: data.slug,
        archiveFilename: data.archive_filename,
        uploadedAt: new Date(data.uploaded_at),
        fileCount: data.file_count,
        totalSizeBytes: data.total_size_bytes,
      });

      return Result.success(entity);
    } catch (error) {
      return Result.success(null); // Return null on error to avoid breaking
    }
  }

  async deleteByProjectId(projectId: string): Promise<Result<void, LandingNotFoundError>> {
    try {
      const { error } = await getSupabaseClient()
        .from('project_landings')
        .delete()
        .eq('project_id', projectId);

      if (error) {
        return Result.failure(new LandingNotFoundError(`landing for project ${projectId}`));
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(new LandingNotFoundError(`landing for project ${projectId}`));
    }
  }

  async getLandingFiles(landingId: string): Promise<Result<LandingFileEntity[], LandingNotFoundError>> {
    try {
      const { data, error } = await getSupabaseClient()
        .from('landing_files')
        .select('*')
        .eq('landing_id', landingId);

      if (error) {
        return Result.failure(new LandingNotFoundError(landingId));
      }

      const entities = data.map((file: any) => LandingFileEntity.fromData({
        id: file.id,
        landingId: file.landing_id,
        filename: file.filename,
        contentType: file.content_type,
        sizeBytes: file.size_bytes,
        storagePath: file.storage_path,
        createdAt: new Date(file.created_at),
      }));

      return Result.success(entities);
    } catch (error) {
      return Result.failure(new LandingNotFoundError(landingId));
    }
  }

  async saveLandingFile(data: CreateLandingFileData): Promise<Result<LandingFileEntity, Error>> {
    try {
      const { data: file, error } = await getSupabaseClient()
        .from('landing_files')
        .insert({
          landing_id: data.landingId,
          filename: data.filename,
          content_type: data.contentType,
          size_bytes: data.sizeBytes,
          storage_path: data.storagePath,
        })
        .select()
        .single();

      if (error) {
        return Result.failure(new Error(`Failed to save file metadata: ${error.message}`));
      }

      const entity = LandingFileEntity.fromData({
        id: file.id,
        landingId: file.landing_id,
        filename: file.filename,
        contentType: file.content_type,
        sizeBytes: file.size_bytes,
        storagePath: file.storage_path,
        createdAt: new Date(file.created_at),
      });

      return Result.success(entity);
    } catch (error) {
      return Result.failure(new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }

  async deleteLandingFiles(landingId: string): Promise<Result<void, Error>> {
    try {
      const { error } = await getSupabaseClient()
        .from('landing_files')
        .delete()
        .eq('landing_id', landingId);

      if (error) {
        return Result.failure(new Error(`Failed to delete landing files: ${error.message}`));
      }

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(new Error(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  }
}