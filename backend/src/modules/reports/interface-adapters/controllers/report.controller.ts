import { injectable, inject } from 'inversify';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { GenerateReportUseCase } from '../../application/use-cases/generate-report.use-case';
import { GetReportByTokenUseCase } from '../../application/use-cases/get-report-by-token.use-case';
import { GetReportDataUseCase } from '../../application/use-cases/get-report-data.use-case';
import { GenerateReportUseCaseRequest } from '../../application/use-cases/input-output/generate-report.io';
import { GetReportByTokenUseCaseRequest } from '../../application/use-cases/input-output/get-report-by-token.io';
import { GetReportDataRequest } from '../../application/use-cases/input-output/get-report-data.io';

@injectable()
export class ReportController {
	constructor(
		@inject(TYPES.GenerateReportUseCase)
		private readonly _generateReportUseCase: GenerateReportUseCase,
		@inject(TYPES.GetReportByTokenUseCase)
		private readonly _getReportByTokenUseCase: GetReportByTokenUseCase,
		@inject(TYPES.GetReportDataUseCase)
		private readonly _getReportDataUseCase: GetReportDataUseCase
	) {}

	public async generateReport(request: GenerateReportUseCaseRequest): Promise<ReturnType<GenerateReportUseCase['execute']>> {
		return this._generateReportUseCase.execute(request);
	}

	public async getReportByToken(request: GetReportByTokenUseCaseRequest): Promise<ReturnType<GetReportByTokenUseCase['execute']>> {
		return this._getReportByTokenUseCase.execute(request);
	}

	public async getReportData(request: GetReportDataRequest): Promise<ReturnType<GetReportDataUseCase['execute']>> {
		return this._getReportDataUseCase.execute(request);
	}
}
