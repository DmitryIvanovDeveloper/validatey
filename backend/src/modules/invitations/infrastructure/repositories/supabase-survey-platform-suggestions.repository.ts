import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { SurveyPlatformSuggestionsRepositoryPort } from '../../application/ports/survey-platform-suggestions-repository.port';
import { SurveyPlatformSuggestion } from '../../../projects/application/ports/survey-platforms-llm.port';

const TABLE = 'survey_platform_suggestions';

interface SurveyPlatformSuggestionsRow {
  id: string;
  project_id: string;
  platforms: SurveyPlatformSuggestion[];
  created_at: string;
  updated_at: string;
}

@injectable()
export class SupabaseSurveyPlatformSuggestionsRepository implements SurveyPlatformSuggestionsRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async findByProjectId(projectId: string): Promise<ResultEx<SurveyPlatformSuggestion[] | null, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(TABLE)
        .select('platforms')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return ResultEx.success(null);
        }
        this._logger.error('supabase-survey-platform-suggestions-repository.find-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      if (!data || !data.platforms) {
        return ResultEx.success(null);
      }

      return ResultEx.success(data.platforms as SurveyPlatformSuggestion[]);
    } catch (error) {
      this._logger.error('supabase-survey-platform-suggestions-repository.find-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async save(projectId: string, platforms: SurveyPlatformSuggestion[]): Promise<ResultEx<void, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from(TABLE)
        .upsert(
          {
            project_id: projectId,
            platforms: platforms,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'project_id' }
        );

      if (error) {
        this._logger.error('supabase-survey-platform-suggestions-repository.save-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-survey-platform-suggestions-repository.save-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
