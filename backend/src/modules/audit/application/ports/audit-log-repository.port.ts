import ResultEx from '../../../../infrastructure/result/result';
import { AuditEntry } from '../../domain/entities/audit-entry.entity';

export interface AuditLogRepositoryPort {
  append(entry: AuditEntry): Promise<ResultEx<void, Error>>;
}
