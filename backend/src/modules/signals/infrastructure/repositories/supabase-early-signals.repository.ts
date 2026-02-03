import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { EarlySignal } from '../../domain/entities/early-signal.entity';
import { EarlySignalsRepositoryPort } from '../../application/ports/early-signals-repository.port';

@injectable()
export class SupabaseEarlySignalsRepository implements EarlySignalsRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async save(projectId: string, signals: EarlySignal[]): Promise<ResultEx<void, Error>> {
    try {
      const supabase = getSupabaseClient();

      const { error: deleteError } = await supabase
        .from('early_signals')
        .delete()
        .eq('project_id', projectId);

      if (deleteError) {
        this._logger.error('supabase-early-signals-repository.delete-error', {
          projectId,
          error: deleteError,
        });
        return ResultEx.failure(new Error(deleteError.message));
      }

      if (signals.length === 0) {
        return ResultEx.success(undefined);
      }

      const rows = signals.map((s) => ({
        id: s.id,
        project_id: projectId,
        type: s.type,
        title: s.title,
        description: s.description || null,
        created_at: s.timestamp.toISOString(),
      }));

      const { error: insertError } = await supabase.from('early_signals').insert(rows);

      if (insertError) {
        this._logger.error('supabase-early-signals-repository.insert-error', {
          projectId,
          error: insertError,
        });
        return ResultEx.failure(new Error(insertError.message));
      }

      return ResultEx.success(undefined);
    } catch (error) {
      this._logger.error('supabase-early-signals-repository.save-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<EarlySignal[], Error>> {
    try {
      const supabase = getSupabaseClient();

      const { data, error } = await supabase
        .from('early_signals')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) {
        this._logger.error('supabase-early-signals-repository.find-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }

      const signals: EarlySignal[] = (data || []).map((row: any) => ({
        id: row.id,
        type: row.type,
        title: row.title,
        description: row.description || '',
        timestamp: new Date(row.created_at),
      }));

      return ResultEx.success(signals);
    } catch (error) {
      this._logger.error('supabase-early-signals-repository.find-exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
