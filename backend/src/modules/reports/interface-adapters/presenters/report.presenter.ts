import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GenerateReportUseCase } from '../../application/use-cases/generate-report.use-case';
import { GetReportByTokenUseCase } from '../../application/use-cases/get-report-by-token.use-case';
import { GenerateReportUseCaseRequest } from '../../application/use-cases/input-output/generate-report.io';
import { GetReportByTokenUseCaseRequest } from '../../application/use-cases/input-output/get-report-by-token.io';

@injectable()
export class ReportPresenter {
  constructor(
    @inject(TYPES.GenerateReportUseCase)
    private readonly _generateReportUseCase: GenerateReportUseCase,
    @inject(TYPES.GetReportByTokenUseCase)
    private readonly _getReportByTokenUseCase: GetReportByTokenUseCase
  ) {}

  async generateReport(request: GenerateReportUseCaseRequest) {
    return await this._generateReportUseCase.execute(request);
  }

  async getReportByToken(request: GetReportByTokenUseCaseRequest) {
    return await this._getReportByTokenUseCase.execute(request);
  }
}



