import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { AuditEntryEntity } from '../../domain/entities/audit-entry.entity';
import { AuditLogRepositoryPort } from '../ports/audit-log-repository.port';
import { RecordAuditEntryUseCaseRequest } from './input-output/record-audit-entry.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class RecordAuditEntryUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.AuditLogRepository)
    private readonly _auditLogRepository: AuditLogRepositoryPort
  ) {}

  async execute(request: RecordAuditEntryUseCaseRequest): Promise<ResultEx<void, Error>> {
    const entry = AuditEntryEntity.create({
      userId: request.userId ?? null,
      action: request.action,
      resourceType: request.resourceType,
      resourceId: request.resourceId ?? null,
      ip: request.ip ?? null,
      userAgent: request.userAgent ?? null,
      metadata: request.metadata ?? null,
    });
    const result = await this._auditLogRepository.append(entry.toData());
    if (!result.isSuccess) {
      this._logger.error('record-audit-entry.append-error', { error: result.error });
      return result;
    }
    return ResultEx.success(undefined);
  }
}
