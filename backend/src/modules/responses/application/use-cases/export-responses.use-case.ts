import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { InvalidResponseDataError } from '../../domain/errors/response.error';
import { ResponseRepositoryPort } from '../ports/response-repository.port';
import {
  ExportResponsesUseCaseRequest,
  ExportResponsesUseCaseResponse,
} from './input-output/export-responses.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

function inferType(value: unknown): string {
  if (typeof value === 'number') return 'scale';
  if (typeof value === 'string') return 'open';
  if (Array.isArray(value)) return 'multiple_choice';
  if (value !== null && typeof value === 'object') return 'object';
  return 'unknown';
}

@injectable()
export class ExportResponsesUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ResponseRepository)
    private readonly _repository: ResponseRepositoryPort
  ) {}

  async execute(
    request: ExportResponsesUseCaseRequest
  ): Promise<ResultEx<ExportResponsesUseCaseResponse, InvalidResponseDataError>> {
    this._logger.info('export-responses.start', { projectId: request.projectId, format: request.format });

    const listResult = await this._repository.findByProjectId(request.projectId);
    if (!listResult.isSuccess) {
      this._logger.error('export-responses.get-error', { error: listResult.error });
      return ResultEx.failure(new InvalidResponseDataError(listResult.error.message));
    }

    const responses = listResult.data;
    const rows: ExportResponsesUseCaseResponse['rows'] = [];

    for (const r of responses) {
      const timestamp = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt);
      if (r.answers && typeof r.answers === 'object') {
        for (const [questionId, value] of Object.entries(r.answers)) {
          rows.push({
            response_id: r.id,
            anonymous_invitation_id: r.invitationId,
            question_id: questionId,
            type: inferType(value),
            value: value as string | number,
            timestamp,
          });
        }
      }
    }

    let content: string;
    if (request.format === 'csv') {
      const header = 'response_id,anonymous_invitation_id,question_id,type,value,timestamp';
      const escape = (v: string | number): string => {
        const s = String(v);
        if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
        return s;
      };
      const lines = [header, ...rows.map((row) => [row.response_id, row.anonymous_invitation_id, row.question_id, row.type, escape(row.value), row.timestamp].join(','))];
      content = lines.join('\n');
    } else {
      content = JSON.stringify(rows, null, 2);
    }

    this._logger.info('export-responses.success', { projectId: request.projectId, rowCount: rows.length });
    return ResultEx.success({ format: request.format, content, rows });
  }
}
