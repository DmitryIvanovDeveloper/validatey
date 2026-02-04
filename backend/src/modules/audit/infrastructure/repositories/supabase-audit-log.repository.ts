import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { getSupabaseClient } from '../../../../infrastructure/database/supabase-client';
import { AuditEntry } from '../../domain/entities/audit-entry.entity';
import { AuditLogRepositoryPort } from '../../application/ports/audit-log-repository.port';

@injectable()
export class SupabaseAuditLogRepository implements AuditLogRepositoryPort {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async append(entry: AuditEntry): Promise<ResultEx<void, Error>> {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.from('audit_log').insert({
        id: entry.id,
        user_id: entry.userId,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        timestamp: entry.timestamp.toISOString(),
        ip: entry.ip,
        user_agent: entry.userAgent,
        metadata: entry.metadata,
      });

      if (error) {
        this._logger.error('supabase-audit-log-repository.append-error', { error });
        return ResultEx.failure(new Error(error.message));
      }
      return ResultEx.success(undefined);
    } catch (err) {
      this._logger.error('supabase-audit-log-repository.append-exception', { error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }
}
