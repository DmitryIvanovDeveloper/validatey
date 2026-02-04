import { injectable } from 'inversify';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { ScenarioRatingRepositoryPort } from '../../application/ports/scenario-rating-repository.port';

@injectable()
export class SupabaseScenarioRatingRepository implements ScenarioRatingRepositoryPort {
  async save(params: {
    projectId: string;
    scenarioId: string;
    rating: number;
    userId?: string;
  }): Promise<{ id: string } | { error: string }> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('scenario_ratings')
        .insert({
          project_id: params.projectId,
          scenario_id: params.scenarioId,
          rating: params.rating,
          user_id: params.userId ?? null,
        })
        .select('id')
        .single();

      if (error) {
        return { error: error.message };
      }
      return { id: data.id };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
}
