import { Container } from 'inversify';
import { TYPES } from './types';
import { AuditLogRepositoryPort } from '../../application/ports/audit-log-repository.port';
import { SupabaseAuditLogRepository } from '../repositories/supabase-audit-log.repository';
import { RecordAuditEntryUseCase } from '../../application/use-cases/record-audit-entry.use-case';

export function bindAudit(container: Container): void {
  container.bind<AuditLogRepositoryPort>(TYPES.AuditLogRepository).to(SupabaseAuditLogRepository);
  container.bind<RecordAuditEntryUseCase>(TYPES.RecordAuditEntryUseCase).to(RecordAuditEntryUseCase);
}
