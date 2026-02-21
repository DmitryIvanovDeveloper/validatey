import ResultEx from '../../../../infrastructure/result/result';
import { SurveyPlatformSuggestion } from '../../../projects/application/ports/survey-platforms-llm.port';

export interface SurveyPlatformSuggestionsRepositoryPort {
  findByProjectId(projectId: string): Promise<ResultEx<SurveyPlatformSuggestion[] | null, Error>>;
  save(projectId: string, platforms: SurveyPlatformSuggestion[]): Promise<ResultEx<void, Error>>;
}
