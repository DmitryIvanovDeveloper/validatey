import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ReportNotFoundError } from '../../domain/errors/report.error';
import { ReportRepositoryPort } from '../ports/report-repository.port';
import { GetReportByTokenUseCaseRequest, GetReportByTokenUseCaseResponse } from './input-output/get-report-by-token.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class GetReportByTokenUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ReportRepository)
    private readonly _repository: ReportRepositoryPort
  ) {}

  async execute(
    request: GetReportByTokenUseCaseRequest
  ): Promise<ResultEx<GetReportByTokenUseCaseResponse, ReportNotFoundError>> {
    this._logger.info('get-report-by-token.start', { token: request.token.substring(0, 10) + '...' });

    const findResult = await this._repository.findByToken(request.token);

    if (!findResult.isSuccess) {
      this._logger.error('get-report-by-token.not-found', { token: request.token.substring(0, 10) + '...' });
      return ResultEx.failure(findResult.error);
    }

    this._logger.info('get-report-by-token.success', { reportId: findResult.data.id });

    return ResultEx.success({
      report: findResult.data,
    });
  }
}



