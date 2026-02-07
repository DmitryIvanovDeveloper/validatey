import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperSourceRepositoryPort } from '../ports/scraper-source-repository.port';
import { ScraperSourceEntity } from '../../domain/entities/scraper-source.entity';
import { InvalidScraperConfigError, ScraperValidationError } from '../../domain/errors/scraper.error';
import type { AddScraperSourceRequest, AddScraperSourceResponse } from './input-output/scraper.io';

function validateAddRequest(
  request: AddScraperSourceRequest
): { fields: Record<string, string> } | null {
  const fields: Record<string, string> = {};
  if (request.type === 'custom') {
    const hasSelectors =
      request.customSelectors?.selectors &&
      typeof request.customSelectors.selectors === 'object' &&
      Object.keys(request.customSelectors.selectors).length > 0;
    if (!hasSelectors) {
      fields.customSelectors = 'Custom selectors are required for type "Custom parsing". Add at least one selector (e.g. container, title).';
    }
  }
  if (!Array.isArray(request.urls) || request.urls.length === 0) {
    fields.urls = 'At least one URL is required.';
  } else {
    const valid = request.urls.filter((u) => typeof u === 'string' && String(u).trim());
    if (valid.length === 0) {
      fields.urls = 'At least one valid URL is required.';
    }
  }
  return Object.keys(fields).length > 0 ? { fields } : null;
}

@injectable()
export class AddScraperSourceUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.ScraperSourceRepository)
    private readonly _repository: ScraperSourceRepositoryPort
  ) {}

  async execute(
    request: AddScraperSourceRequest
  ): Promise<ResultEx<AddScraperSourceResponse, InvalidScraperConfigError | ScraperValidationError | Error>> {
    this._logger.info('add-scraper-source.start', { projectId: request.projectId, type: request.type });

    const validation = validateAddRequest(request);
    if (validation) {
      return ResultEx.failure(
        new ScraperValidationError('Validation failed', validation.fields)
      );
    }

    try {
      const entity = ScraperSourceEntity.create({
        projectId: request.projectId,
        type: request.type,
        name: request.name,
        researchGoal: request.researchGoal ?? null,
        urls: request.urls,
        whatToCollect: request.whatToCollect,
        frequency: request.frequency,
        aiProcessing: request.aiProcessing,
        customSelectors: request.customSelectors ?? null,
        stopOnFirstError: request.stopOnFirstError,
      });
      const source = entity.toData();
      const result = await this._repository.create(source);
      if (!result.isSuccess) {
        return ResultEx.failure(result.error);
      }
      this._logger.info('add-scraper-source.success', { id: result.data.id });
      return ResultEx.success({ source: result.data });
    } catch (err) {
      if (err instanceof InvalidScraperConfigError || err instanceof ScraperValidationError) {
        return ResultEx.failure(err);
      }
      this._logger.error('add-scraper-source.error', { request, error: err });
      return ResultEx.failure(err instanceof Error ? err : new Error('Unknown error'));
    }
  }
}
