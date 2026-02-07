import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import type { RoundRepositoryPort } from '../../application/ports/round-repository.port';
import type { Round, RoundResults } from '../../domain/entities/round.entity';
import { RoundNotFoundError, InvalidRoundDataError } from '../../domain/errors/round.error';

function mapResults(results: unknown): RoundResults | null {
  if (results == null || typeof results !== 'object') {
    return null;
  }
  const o = results as Record<string, unknown>;
  return {
    keyFinding: typeof o.keyFinding === 'string' ? o.keyFinding : undefined,
    confidence: typeof o.confidence === 'number' ? o.confidence : undefined,
    nextQuestions: Array.isArray(o.nextQuestions)
      ? (o.nextQuestions as string[]).filter((q) => typeof q === 'string')
      : undefined,
  };
}

function mapRowToRound(row: Record<string, unknown>): Round {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    parentRoundId: row.parent_round_id != null ? String(row.parent_round_id) : null,
    title: String(row.title ?? 'Round'),
    status: (row.status as Round['status']) ?? 'draft',
    type: (row.type as Round['type']) ?? 'survey',
    sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0,
    results: mapResults(row.results),
    createdAt: new Date(String(row.created_at)),
    updatedAt: new Date(String(row.updated_at)),
  };
}

@injectable()
export class SupabaseRoundRepository implements RoundRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async create(round: Round): Promise<ResultEx<Round, InvalidRoundDataError>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('rounds')
        .insert({
          id: round.id,
          project_id: round.projectId,
          parent_round_id: round.parentRoundId,
          title: round.title,
          status: round.status,
          type: round.type,
          sort_order: round.sortOrder,
          results: round.results ?? null,
          created_at: round.createdAt.toISOString(),
          updated_at: round.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-round-repository.create-error', { error });
        return ResultEx.failure(new InvalidRoundDataError(error.message));
      }
      return ResultEx.success(mapRowToRound(data as Record<string, unknown>));
    } catch (err) {
      this._logger.error('supabase-round-repository.create-exception', { error: err });
      return ResultEx.failure(
        new InvalidRoundDataError(err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<Round, RoundNotFoundError>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        this._logger.error('supabase-round-repository.find-by-id-error', { id, error });
        return ResultEx.failure(new RoundNotFoundError(id));
      }
      if (!data) {
        return ResultEx.failure(new RoundNotFoundError(id));
      }
      return ResultEx.success(mapRowToRound(data as Record<string, unknown>));
    } catch (err) {
      this._logger.error('supabase-round-repository.find-by-id-exception', { id, error: err });
      return ResultEx.failure(new RoundNotFoundError(id));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<Round[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .eq('project_id', projectId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        this._logger.error('supabase-round-repository.find-by-project-id-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }
      const list = (data ?? []).map((row) => mapRowToRound(row as Record<string, unknown>));
      return ResultEx.success(list);
    } catch (err) {
      this._logger.error('supabase-round-repository.find-by-project-id-exception', { projectId, error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async update(round: Round): Promise<ResultEx<Round, RoundNotFoundError | InvalidRoundDataError>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('rounds')
        .update({
          title: round.title,
          status: round.status,
          type: round.type,
          sort_order: round.sortOrder,
          results: round.results ?? null,
          updated_at: round.updatedAt.toISOString(),
        })
        .eq('id', round.id)
        .eq('project_id', round.projectId)
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-round-repository.update-error', { id: round.id, error });
        if (error.code === 'PGRST116') {
          return ResultEx.failure(new RoundNotFoundError(round.id));
        }
        return ResultEx.failure(new InvalidRoundDataError(error.message));
      }
      return ResultEx.success(mapRowToRound(data as Record<string, unknown>));
    } catch (err) {
      this._logger.error('supabase-round-repository.update-exception', { error: err });
      return ResultEx.failure(
        new InvalidRoundDataError(err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }

  async delete(id: string, projectId: string): Promise<ResultEx<void, RoundNotFoundError | Error>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('rounds')
        .delete()
        .eq('id', id)
        .eq('project_id', projectId);

      if (error) {
        this._logger.error('supabase-round-repository.delete-error', { id, projectId, error });
        if (error.code === 'PGRST116') {
          return ResultEx.failure(new RoundNotFoundError(id));
        }
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(undefined);
    } catch (err) {
      this._logger.error('supabase-round-repository.delete-exception', { id, projectId, error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }
}
