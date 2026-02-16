import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { Project } from '../../domain/entities/project.entity';
import { ProjectNotFoundError, InvalidProjectDataError } from '../../domain/errors/project.error';
import { ProjectRepositoryPort } from '../../application/ports/project-repository.port';

@injectable()
export class SupabaseProjectRepository implements ProjectRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(project: Project): Promise<ResultEx<Project, InvalidProjectDataError>> {
    try {
      const supabase = getSupabaseClient();

      const nowIso = new Date().toISOString();
      const created_at = project.createdAt != null && typeof project.createdAt.toISOString === 'function'
        ? project.createdAt.toISOString()
        : nowIso;
      const updated_at = project.updatedAt != null && typeof project.updatedAt.toISOString === 'function'
        ? project.updatedAt.toISOString()
        : nowIso;

      const { data, error } = await supabase
        .from('projects')
        .insert({
          id: project.id,
          user_id: project.userId,
          workspace_id: project.workspaceId ?? null,
          name: project.name,
          status: project.status,
          segment: project.segment,
          hypothesis: project.hypothesis,
          market_context: project.marketContext,
          target_audience: project.targetAudience,
          cost: project.cost,
          consent_text: project.consentText ?? null,
          consent_data_usage_text: project.dataUsageText ?? null,
          privacy_policy_url: project.privacyPolicyUrl ?? null,
          terms_of_service_url: project.termsOfServiceUrl ?? null,
          scenario_template_slug: project.scenarioTemplateSlug ?? null,
          public_access_enabled: project.publicAccessEnabled ?? false,
          public_slug: project.publicSlug ?? null,
          max_public_responses: project.maxPublicResponses ?? null,
          require_public_email: project.requirePublicEmail ?? false,
          captcha_enabled: project.captchaEnabled ?? false,
          created_at,
          updated_at,
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-project-repository.create-error', { error });
        return ResultEx.failure(new InvalidProjectDataError(error.message));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-project-repository.create-exception', { error });
      return ResultEx.failure(
        new InvalidProjectDataError(error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Project, ProjectNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('projects').select('*').eq('id', id).single();

      if (error) {
        this._logger.error('supabase-project-repository.find-by-id-error', { 
          id, 
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          }
        });
        // PGRST116 = no rows returned
        if (error.code === 'PGRST116') {
          return ResultEx.failure(new ProjectNotFoundError(id));
        }
        // Other errors might be RLS or connection issues
        this._logger.warn('supabase-project-repository.find-by-id-unexpected-error', {
          id,
          errorCode: error.code,
          hint: 'This might be an RLS policy issue. Check if SUPABASE_SERVICE_ROLE_KEY is set in .env'
        });
        return ResultEx.failure(new ProjectNotFoundError(id));
      }

      if (!data) {
        this._logger.error('supabase-project-repository.find-by-id-no-data', { id });
        return ResultEx.failure(new ProjectNotFoundError(id));
      }

      try {
        const mapped = this.mapToDomain(data);
        return ResultEx.success(mapped);
      } catch (mapError) {
        this._logger.error('supabase-project-repository.find-by-id-map-error', { 
          id, 
          data,
          mapError: mapError instanceof Error ? mapError.message : String(mapError)
        });
        return ResultEx.failure(new ProjectNotFoundError(id));
      }
    } catch (error) {
      this._logger.error('supabase-project-repository.find-by-id-exception', { 
        id, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return ResultEx.failure(new ProjectNotFoundError(id));
    }
  }

  async findByPublicSlug(slug: string): Promise<ResultEx<Project, ProjectNotFoundError>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('projects').select('*').eq('public_slug', slug).single();
      if (error || !data) {
        if (error?.code === 'PGRST116') {
          return ResultEx.failure(new ProjectNotFoundError(slug));
        }
        this._logger.error('supabase-project-repository.find-by-public-slug-error', { slug, error });
        return ResultEx.failure(new ProjectNotFoundError(slug));
      }
      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      this._logger.error('supabase-project-repository.find-by-public-slug-exception', { slug, error });
      return ResultEx.failure(new ProjectNotFoundError(slug));
    }
  }

  async generateUniquePublicSlug(): Promise<ResultEx<string, Error>> {
    try {
      const supabase = getSupabaseClient();
      const crypto = await import('crypto');
      for (let attempt = 0; attempt < 10; attempt++) {
        const slug = crypto.randomBytes(5).toString('base64url').replace(/[-_]/g, '').slice(0, 10).toLowerCase();
        const { data } = await supabase.from('projects').select('id').eq('public_slug', slug).maybeSingle();
        if (!data) {
          return ResultEx.success(slug);
        }
      }
      return ResultEx.failure(new Error('Failed to generate unique public slug'));
    } catch (error) {
      this._logger.error('supabase-project-repository.generate-unique-public-slug-exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByWorkspaceId(workspaceId: string): Promise<ResultEx<Project[], Error>> {
    try {
      console.log('[Repository] findByWorkspaceId start', { workspaceId });
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('projects').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });

      console.log('[Repository] Query executed', { hasError: !!error, dataCount: data?.length || 0 });

      if (error) {
        console.error('[Repository] Supabase error', { error: error.message, code: error.code, details: error });
        this._logger.error('supabase-project-repository.find-by-workspace-id-error', { workspaceId, error: error.message, code: error.code });
        return ResultEx.failure(new Error(`Database error: ${error.message} (code: ${error.code})`));
      }

      if (!data || !Array.isArray(data)) {
        console.log('[Repository] Empty result');
        this._logger.info('supabase-project-repository.find-by-workspace-id.empty-result', { workspaceId });
        return ResultEx.success([]);
      }

      try {
        console.log('[Repository] Mapping data', { count: data.length });
        const projects = data.map((item, index) => {
          try {
            console.log(`[Repository] Mapping item ${index}`, { id: item?.id, name: item?.name });
            return this.mapToDomain(item);
          } catch (mapError) {
            console.error(`[Repository] Map error for item ${index}`, { item, error: mapError });
            this._logger.error('supabase-project-repository.find-by-workspace-id.map-error', {
              workspaceId,
              itemId: item?.id,
              error: mapError instanceof Error ? mapError.message : String(mapError)
            });
            throw mapError;
          }
        });
        console.log('[Repository] Mapping successful', { count: projects.length });
        this._logger.info('supabase-project-repository.find-by-workspace-id.success', { workspaceId, count: projects.length });
        return ResultEx.success(projects);
      } catch (mapError) {
        console.error('[Repository] Mapping failed', { error: mapError });
        this._logger.error('supabase-project-repository.find-by-workspace-id.mapping-failed', { workspaceId, error: mapError });
        return ResultEx.failure(mapError instanceof Error ? mapError : new Error('Failed to map data to domain'));
      }
    } catch (error) {
      console.error('[Repository] Exception', { error, stack: error instanceof Error ? error.stack : undefined });
      this._logger.error('supabase-project-repository.find-by-workspace-id-exception', { workspaceId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByUserId(userId: string): Promise<ResultEx<Project[], Error>> {
    try {
      console.log('[Repository] findByUserId start', { userId });
      const supabase = getSupabaseClient();
      console.log('[Repository] Supabase client obtained');

      this._logger.info('supabase-project-repository.find-by-user-id.start', { userId });

      const { data, error } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      console.log('[Repository] Query executed', { hasError: !!error, dataCount: data?.length || 0 });

      if (error) {
        console.error('[Repository] Supabase error', { error: error.message, code: error.code, details: error });
        this._logger.error('supabase-project-repository.find-by-user-id-error', { userId, error: error.message, code: error.code });
        return ResultEx.failure(new Error(`Database error: ${error.message} (code: ${error.code})`));
      }

      this._logger.info('supabase-project-repository.find-by-user-id.data-received', { userId, count: data?.length || 0 });

      if (!data || !Array.isArray(data)) {
        console.log('[Repository] Empty result');
        this._logger.info('supabase-project-repository.find-by-user-id.empty-result', { userId });
        return ResultEx.success([]);
      }

      try {
        console.log('[Repository] Mapping data', { count: data.length });
        const projects = data.map((item, index) => {
          try {
            console.log(`[Repository] Mapping item ${index}`, { id: item?.id, name: item?.name });
            return this.mapToDomain(item);
          } catch (mapError) {
            console.error(`[Repository] Map error for item ${index}`, { item, error: mapError });
            this._logger.error('supabase-project-repository.find-by-user-id.map-error', { 
              userId, 
              itemId: item?.id, 
              error: mapError instanceof Error ? mapError.message : String(mapError) 
            });
            throw mapError;
          }
        });
        console.log('[Repository] Mapping successful', { count: projects.length });
        this._logger.info('supabase-project-repository.find-by-user-id.success', { userId, count: projects.length });
        return ResultEx.success(projects);
      } catch (mapError) {
        console.error('[Repository] Mapping failed', { error: mapError });
        this._logger.error('supabase-project-repository.find-by-user-id.mapping-failed', { userId, error: mapError });
        return ResultEx.failure(mapError instanceof Error ? mapError : new Error('Failed to map data to domain'));
      }
    } catch (error) {
      console.error('[Repository] Exception', { error, stack: error instanceof Error ? error.stack : undefined });
      this._logger.error('supabase-project-repository.find-by-user-id-exception', { userId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findAll(): Promise<ResultEx<Project[], Error>> {
    try {
      console.log('[Repository] findAll start');
      const supabase = getSupabaseClient();
      console.log('[Repository] Supabase client obtained for findAll');

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('[Repository] findAll query executed', { hasError: !!error, dataCount: data?.length || 0 });

      if (error) {
        console.error('[Repository] findAll Supabase error', { error: error.message, code: error.code });
        this._logger.error('supabase-project-repository.find-all-error', { error: error.message });
        return ResultEx.failure(new Error(error.message));
      }
      if (!data || !Array.isArray(data)) {
        console.log('[Repository] findAll: empty result');
        return ResultEx.success([]);
      }

      console.log('[Repository] findAll: mapping data', { count: data.length });
      const projects = data.map((item, index) => {
        console.log(`[Repository] findAll mapping item ${index}`, { id: item?.id, name: item?.name, userId: item?.user_id });
        return this.mapToDomain(item);
      });

      console.log('[Repository] findAll: success', { count: projects.length });
      return ResultEx.success(projects);
    } catch (error) {
      this._logger.error('supabase-project-repository.find-all-exception', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async update(project: Project): Promise<ResultEx<Project, ProjectNotFoundError | InvalidProjectDataError>> {
    try {
      const supabase = getSupabaseClient();

      // Sanitize and validate data before sending
      const sanitizeValue = (value: unknown): unknown => {
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value === 'string') {
          // Trim and limit string length to prevent issues (Supabase text fields can be very long, but we'll be safe)
          const trimmed = value.trim();
          // Limit to 1MB per string field to prevent issues
          const maxLength = 1024 * 1024;
          if (trimmed.length > maxLength) {
            this._logger.warn('supabase-project-repository.update-string-too-long', {
              length: trimmed.length,
              maxLength,
            });
            return trimmed.substring(0, maxLength);
          }
          return trimmed;
        }
        if (typeof value === 'object') {
          // Deep clone to avoid circular references and ensure clean serialization
          try {
            // First, try to serialize to check for circular references
            const serialized = JSON.stringify(value);
            // Check size (in Node.js, use Buffer.byteLength)
            const sizeInBytes = Buffer.byteLength(serialized, 'utf8');
            const maxSizeInBytes = 10 * 1024 * 1024; // 10MB limit for JSONB fields
            if (sizeInBytes > maxSizeInBytes) {
              this._logger.warn('supabase-project-repository.update-object-too-large', {
                sizeInBytes,
                maxSizeInBytes,
              });
              // Try to truncate if it's marketContext with long strings
              if (value && typeof value === 'object' && ('marketPicture' in value || 'marketFit' in value || 'differentiation' in value)) {
                const truncated: Record<string, unknown> = {};
                const obj = value as Record<string, unknown>;
                for (const key in obj) {
                  if (typeof obj[key] === 'string') {
                    truncated[key] = (obj[key] as string).substring(0, 1024 * 1024); // 1MB per field
                  } else {
                    truncated[key] = obj[key];
                  }
                }
                return truncated;
              }
              return null;
            }
            return JSON.parse(serialized);
          } catch (e) {
            this._logger.error('supabase-project-repository.update-serialization-error', {
              valueType: typeof value,
              error: e instanceof Error ? e.message : String(e),
              hasCircular: e instanceof Error && e.message.includes('circular'),
            });
            // If it's marketContext, try to extract only the string fields
            if (value && typeof value === 'object' && ('marketPicture' in value || 'marketFit' in value || 'differentiation' in value)) {
              const clean: Record<string, string> = {};
              const v = value as { marketPicture?: string; marketFit?: string; differentiation?: string };
              if (v.marketPicture && typeof v.marketPicture === 'string') {
                clean.marketPicture = v.marketPicture.substring(0, 1024 * 1024);
              }
              if (v.marketFit && typeof v.marketFit === 'string') {
                clean.marketFit = v.marketFit.substring(0, 1024 * 1024);
              }
              if (v.differentiation && typeof v.differentiation === 'string') {
                clean.differentiation = v.differentiation.substring(0, 1024 * 1024);
              }
              return Object.keys(clean).length > 0 ? clean : null;
            }
            return null;
          }
        }
        return value;
      };

      // Prepare update data with sanitization
      const updateData = {
        workspace_id: project.workspaceId ?? null,
        name: sanitizeValue(project.name),
        status: sanitizeValue(project.status),
        segment: sanitizeValue(project.segment),
        hypothesis: sanitizeValue(project.hypothesis),
        market_context: sanitizeValue(project.marketContext),
        target_audience: sanitizeValue(project.targetAudience),
        cost: project.cost !== null && project.cost !== undefined ? Number(project.cost) : null,
        consent_text: project.consentText != null ? sanitizeValue(project.consentText) : null,
        consent_data_usage_text: project.dataUsageText != null ? sanitizeValue(project.dataUsageText) : null,
        privacy_policy_url: project.privacyPolicyUrl != null ? sanitizeValue(project.privacyPolicyUrl) : null,
        terms_of_service_url: project.termsOfServiceUrl != null ? sanitizeValue(project.termsOfServiceUrl) : null,
        scenario_template_slug: project.scenarioTemplateSlug != null && String(project.scenarioTemplateSlug).trim() !== ''
          ? String(project.scenarioTemplateSlug).trim()
          : null,
        public_access_enabled: project.publicAccessEnabled ?? false,
        public_slug: project.publicSlug != null ? String(project.publicSlug).trim() || null : null,
        max_public_responses: project.maxPublicResponses != null ? Number(project.maxPublicResponses) : null,
        require_public_email: project.requirePublicEmail ?? false,
        captcha_enabled: project.captchaEnabled ?? false,
        deadline: project.deadline != null && typeof project.deadline.toISOString === 'function' ? project.deadline.toISOString() : null,
        updated_at: project.updatedAt != null && typeof project.updatedAt.toISOString === 'function'
          ? project.updatedAt.toISOString()
          : new Date().toISOString(),
      };

      // Validate critical fields
      if (!updateData.name || typeof updateData.name !== 'string') {
        return ResultEx.failure(new InvalidProjectDataError('Project name is required and must be a string'));
      }

      // Log update attempt (without sensitive data)
      const dataSize = JSON.stringify(updateData).length;
      this._logger.info('supabase-project-repository.update-attempt', {
        id: project.id,
        hasMarketContext: !!project.marketContext,
        marketContextKeys: project.marketContext ? Object.keys(project.marketContext) : [],
        dataSize,
        dataSizeKB: Math.round(dataSize / 1024),
      });

      // Validate data size before sending (Supabase has limits)
      if (dataSize > 50 * 1024 * 1024) { // 50MB limit
        return ResultEx.failure(
          new InvalidProjectDataError(`Update data is too large (${Math.round(dataSize / 1024 / 1024)}MB). Maximum size is 50MB.`)
        );
      }

      // Try to update with retry logic for network errors
      let data, error;
      let retries = 2;
      let lastError: unknown = null;

      while (retries >= 0) {
        try {
          const result = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', project.id)
            .select()
            .single();
          
          data = result.data;
          error = result.error;
          
          // If no error, break out of retry loop
          if (!error) {
            break;
          }
          
          // If it's not a network error, don't retry
          if (error.code && error.code !== 'PGRST116') {
            break;
          }
          
          lastError = error;
        } catch (fetchError) {
          lastError = fetchError;
          const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
          
          // If it's a network error and we have retries left, wait and retry
          if ((errorMessage.includes('fetch failed') || 
               errorMessage.includes('ECONNREFUSED') || 
               errorMessage.includes('ENOTFOUND') ||
               errorMessage.includes('ETIMEDOUT')) && retries > 0) {
            this._logger.warn('supabase-project-repository.update-retry', {
              id: project.id,
              retriesLeft: retries,
              error: errorMessage,
            });
            await new Promise(resolve => setTimeout(resolve, 1000 * (3 - retries))); // Exponential backoff
            retries--;
            continue;
          }
          
          // If it's not a retryable error or no retries left, throw
          throw fetchError;
        }
        
        retries--;
      }

      // Use the last error if we exhausted retries and don't have a Supabase error
      if (!error && lastError && retries < 0) {
        // If we have a fetch error from the catch block, create a proper error object
        const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
        error = {
          message: errorMessage,
          code: 'FETCH_ERROR',
          details: lastError,
        } as { message: string; code: string; details?: unknown; hint?: string };
      }

      if (error) {
        this._logger.error('supabase-project-repository.update-error', {
          id: project.id,
          error: {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          },
        });

        if (error.code === 'PGRST116') {
          const exists = await this.findById(project.id);
          if (exists.isSuccess) {
            this._logger.error('supabase-project-repository.update-no-rows', {
              id: project.id,
              hint: 'Update matched 0 rows. If using SUPABASE_ANON_KEY, RLS may block UPDATE. Use SUPABASE_SERVICE_ROLE_KEY in .env to bypass RLS.',
            });
            return ResultEx.failure(
              new InvalidProjectDataError(
                'Update did not apply (0 rows). Use SUPABASE_SERVICE_ROLE_KEY in backend .env to bypass RLS, or check Supabase RLS policies for projects table.'
              )
            );
          }
          return ResultEx.failure(new ProjectNotFoundError(project.id));
        }
        return ResultEx.failure(new InvalidProjectDataError(error.message));
      }

      if (!data) {
        this._logger.error('supabase-project-repository.update-no-data', { id: project.id });
        return ResultEx.failure(new ProjectNotFoundError(project.id));
      }

      return ResultEx.success(this.mapToDomain(data));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      const errorName = error instanceof Error ? error.constructor.name : typeof error;
      
      // Check for specific error types
      let isNetworkError = false;
      let isSerializationError = false;
      
      if (errorMessage.includes('fetch failed') || 
          errorMessage.includes('ECONNREFUSED') || 
          errorMessage.includes('ENOTFOUND') ||
          errorMessage.includes('ETIMEDOUT') ||
          errorName === 'TypeError' && errorMessage.includes('fetch')) {
        isNetworkError = true;
      }
      
      if (errorMessage.includes('circular') || 
          errorMessage.includes('JSON') || 
          errorMessage.includes('stringify')) {
        isSerializationError = true;
      }
      
      this._logger.error('supabase-project-repository.update-exception', {
        id: project.id,
        error: errorMessage,
        stack: errorStack,
        errorType: errorName,
        isNetworkError,
        isSerializationError,
        hasMarketContext: !!project.marketContext,
      });

      // Provide more specific error messages
      if (isNetworkError) {
        return ResultEx.failure(
          new InvalidProjectDataError(
            `Network error connecting to Supabase: ${errorMessage}. Please check SUPABASE_URL in .env and ensure the service is accessible.`
          )
        );
      }
      
      if (isSerializationError) {
        return ResultEx.failure(
          new InvalidProjectDataError(
            `Data serialization error: ${errorMessage}. The project data may contain invalid or circular references.`
          )
        );
      }

      return ResultEx.failure(new InvalidProjectDataError(errorMessage));
    }
  }

  async delete(id: string): Promise<ResultEx<void, ProjectNotFoundError>> {
    try {
      const supabase = getSupabaseClient();

      const { error } = await supabase.from('projects').delete().eq('id', id);

      if (error) {
        if (error.code === 'PGRST116') {
          this._logger.error('supabase-project-repository.delete-not-found', { id });
          return ResultEx.failure(new ProjectNotFoundError(id));
        }
        this._logger.error('supabase-project-repository.delete-error', { error });
        return ResultEx.failure(new ProjectNotFoundError(id));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-project-repository.delete-exception', { id, error });
      return ResultEx.failure(new ProjectNotFoundError(id));
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<ResultEx<number, Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase.from('projects').delete().eq('workspace_id', workspaceId);

      if (error) {
        this._logger.error('supabase-project-repository.delete-by-workspace-id-error', { workspaceId, error });
        return ResultEx.failure(new Error(`Failed to delete projects for workspace ${workspaceId}: ${error.message}`));
      }

      const deletedCount = (data as any)?.length || 0;
      this._logger.info('supabase-project-repository.delete-by-workspace-id-success', { workspaceId, deletedCount });

      return ResultEx.success(deletedCount);
    } catch (error) {
      this._logger.error('supabase-project-repository.delete-by-workspace-id-exception', { workspaceId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }


  private mapToDomain(data: Record<string, unknown>): Project {
    if (!data) {
      throw new Error('Cannot map null or undefined data to domain');
    }

    try {
      // Validate required fields
      if (!data.id || !data.user_id || !data.name || !data.status) {
        throw new Error(`Missing required fields: id=${data.id}, user_id=${data.user_id}, name=${data.name}, status=${data.status}`);
      }

      // Parse cost safely
      let cost: number | null = null;
      if (data.cost !== null && data.cost !== undefined) {
        const parsed = typeof data.cost === 'string' ? parseFloat(data.cost) : Number(data.cost);
        cost = isNaN(parsed) ? null : parsed;
      }

      // Parse dates safely (Supabase may return snake_case or camelCase)
      const created_at_raw = data.created_at ?? data.createdAt;
      const updated_at_raw = data.updated_at ?? data.updatedAt;
      const createdAt = created_at_raw ? new Date(created_at_raw as string | number) : new Date();
      const updatedAt = updated_at_raw ? new Date(updated_at_raw as string | number) : new Date();

      // Validate dates
      if (isNaN(createdAt.getTime())) {
        throw new Error(`Invalid created_at: ${data.created_at}`);
      }
      if (isNaN(updatedAt.getTime())) {
        throw new Error(`Invalid updated_at: ${data.updated_at}`);
      }

      return {
        id: String(data.id),
        userId: String(data.user_id),
        workspaceId: (data.workspace_id ?? null) as string | null,
        name: String(data.name),
        status: String(data.status) as 'draft' | 'active' | 'completed' | 'archived',
        segment: (data.segment || null) as Project['segment'],
        hypothesis: (data.hypothesis || null) as Project['hypothesis'],
        marketContext: (data.market_context || null) as Project['marketContext'],
        targetAudience: (data.target_audience ?? null) as string | null,
        cost,
        consentText: (data.consent_text ?? null) as string | null,
        dataUsageText: (data.consent_data_usage_text ?? null) as string | null,
        privacyPolicyUrl: (data.privacy_policy_url ?? null) as string | null,
        termsOfServiceUrl: (data.terms_of_service_url ?? null) as string | null,
        scenarioTemplateSlug: (data.scenario_template_slug ?? null) as string | null,
        publicAccessEnabled: Boolean(data.public_access_enabled),
        publicSlug: (data.public_slug ?? null) as string | null,
        maxPublicResponses: data.max_public_responses != null ? Number(data.max_public_responses) : null,
        requirePublicEmail: Boolean(data.require_public_email),
        captchaEnabled: Boolean(data.captcha_enabled),
        deadline: data.deadline != null ? new Date(data.deadline as string | number) : null,
        createdAt,
        updatedAt,
      };
    } catch (error) {
      this._logger.error('mapToDomain-error', { 
        data, 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }
}

