import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvalidConsentDataError } from '../../domain/errors/consent.error';
import { ConsentRepositoryPort } from '../ports/consent-repository.port';
import { ExportConsentsUseCaseRequest, ExportConsentsUseCaseResponse } from './input-output/export-consents.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ExportConsentsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ConsentRepository)
    private readonly _repository: ConsentRepositoryPort
  ) {}

  async execute(
    request: ExportConsentsUseCaseRequest
  ): Promise<ResultEx<ExportConsentsUseCaseResponse, InvalidConsentDataError>> {
    this._logger.info('export-consents.start', { projectId: request.projectId, format: request.format });

    const listResult = await this._repository.listByProjectId(request.projectId);
    if (!listResult.isSuccess) {
      this._logger.error('export-consents.list-error', { error: listResult.error });
      return ResultEx.failure(new InvalidConsentDataError(listResult.error.message));
    }

    const consents = listResult.data;
    const rows = consents.map((c) => ({
      consent_id: c.id,
      project_id: c.projectId,
      invitation_id: c.invitationId,
      consent_text_id: c.consentTextId,
      accepted_at: c.acceptedAt.toISOString(),
      created_at: c.createdAt.toISOString(),
    }));

    let content: string;
    if (request.format === 'csv') {
      const header = 'consent_id,project_id,invitation_id,consent_text_id,accepted_at,created_at';
      const escape = (v: string | null): string => {
        const s = String(v ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines = [
        header,
        ...rows.map((r) =>
          [r.consent_id, r.project_id, r.invitation_id, escape(r.consent_text_id), r.accepted_at, r.created_at].join(',')
        ),
      ];
      content = lines.join('\n');
    } else {
      content = JSON.stringify(rows, null, 2);
    }

    this._logger.info('export-consents.success', { projectId: request.projectId, rowCount: rows.length });
    return ResultEx.success({ format: request.format, content, rows });
  }
}
