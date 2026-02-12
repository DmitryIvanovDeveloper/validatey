import { inject, injectable } from 'inversify';
import type { ExportServicePort } from '../ports/export-service.port';
import type { ExportResponsesUseCaseRequest, ExportResponsesUseCaseResponse } from './input-output/export-responses.io';
import { TYPES } from '../../infrastructure/bootstrap/types';

@injectable()
export class ExportResponsesUseCase {
  constructor(
    @inject(TYPES.ExportService)
    private readonly _exportService: ExportServicePort
  ) {}

  async execute(request: ExportResponsesUseCaseRequest): Promise<ExportResponsesUseCaseResponse> {
    return await this._exportService.exportResponses(request.projectId, request.format);
  }
}