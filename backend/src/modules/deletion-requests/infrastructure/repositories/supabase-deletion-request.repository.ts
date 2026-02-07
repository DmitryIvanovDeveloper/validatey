import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { DeletionRequest, DeletionRequestStatus } from '../../domain/entities/deletion-request.entity';
import {
  DeletionRequestNotFoundError,
  InvalidDeletionRequestDataError,
} from '../../domain/errors/deletion-request.error';
import { DeletionRequestRepositoryPort } from '../../application/ports/deletion-request-repository.port';

@injectable()
export class SupabaseDeletionRequestRepository implements DeletionRequestRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async save(request: DeletionRequest): Promise<ResultEx<DeletionRequest, InvalidDeletionRequestDataError>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('deletion_requests')
        .insert({
          id: request.id,
          project_id: request.projectId,
          identifier: request.identifier,
          status: request.status,
          requested_at: request.requestedAt.toISOString(),
          completed_at: request.completedAt ? request.completedAt.toISOString() : null,
          requested_by: request.requestedBy,
          created_at: request.createdAt.toISOString(),
          updated_at: request.updatedAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        this._logger.error('supabase-deletion-request-repository.save-error', { error });
        return ResultEx.failure(new InvalidDeletionRequestDataError(error.message));
      }
      return ResultEx.success(this.mapToDomain(data));
    } catch (err) {
      this._logger.error('supabase-deletion-request-repository.save-exception', { error: err });
      return ResultEx.failure(
        new InvalidDeletionRequestDataError(err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }

  async findById(id: string): Promise<ResultEx<DeletionRequest, DeletionRequestNotFoundError>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from('deletion_requests').select('*').eq('id', id).single();
      if (error || !data) {
        return ResultEx.failure(new DeletionRequestNotFoundError(id));
      }
      return ResultEx.success(this.mapToDomain(data));
    } catch {
      return ResultEx.failure(new DeletionRequestNotFoundError(id));
    }
  }

  async findByProjectId(projectId: string): Promise<ResultEx<DeletionRequest[], Error>> {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('deletion_requests')
        .select('*')
        .eq('project_id', projectId)
        .order('requested_at', { ascending: false });

      if (error) {
        this._logger.error('supabase-deletion-request-repository.find-by-project-id-error', { projectId, error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success((data || []).map((row: Record<string, unknown>) => this.mapToDomain(row)));
    } catch (err) {
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }

  async updateStatus(
    id: string,
    status: DeletionRequestStatus
  ): Promise<ResultEx<DeletionRequest, DeletionRequestNotFoundError | InvalidDeletionRequestDataError>> {
    const findResult = await this.findById(id);
    if (!findResult.isSuccess) return findResult;
    const existing = findResult.data;
    const completedAt = status === 'completed' || status === 'rejected' ? new Date() : existing.completedAt;
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('deletion_requests')
        .update({
          status,
          completed_at: completedAt ? completedAt.toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return ResultEx.failure(new InvalidDeletionRequestDataError(error.message));
      }
      return ResultEx.success(this.mapToDomain(data));
    } catch (err) {
      return ResultEx.failure(
        new InvalidDeletionRequestDataError(err instanceof Error ? err.message : 'Unknown error')
      );
    }
  }

  private mapToDomain(row: Record<string, unknown>): DeletionRequest {
    return {
      id: String(row.id),
      projectId: String(row.project_id),
      identifier: String(row.identifier),
      status: row.status as DeletionRequest['status'],
      requestedAt: row.requested_at ? new Date(String(row.requested_at)) : new Date(String(row.created_at)),
      completedAt: row.completed_at ? new Date(String(row.completed_at)) : null,
      requestedBy: row.requested_by != null ? String(row.requested_by) : null,
      createdAt: new Date(String(row.created_at)),
      updatedAt: new Date(String(row.updated_at)),
    };
  }
}
