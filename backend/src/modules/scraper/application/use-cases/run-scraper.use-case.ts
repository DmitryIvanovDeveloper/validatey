import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperSourceRepositoryPort } from '../ports/scraper-source-repository.port';
import type { ScraperRunRepositoryPort } from '../ports/scraper-run-repository.port';
import type { WebScraperPort } from '../ports/web-scraper.port';
import { ScraperRunEntity } from '../../domain/entities/scraper-run.entity';
import { createRunStats } from '../../domain/value-objects/run-stats.vo';
import { ScraperNotFoundError, ScraperRunFailedError } from '../../domain/errors/scraper.error';
import type { RunScraperRequest, RunScraperResponse } from './input-output/scraper.io';

@injectable()
export class RunScraperUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.ScraperSourceRepository)
    private readonly _sourceRepository: ScraperSourceRepositoryPort,
    @inject(SCRAPER_TYPES.ScraperRunRepository)
    private readonly _runRepository: ScraperRunRepositoryPort,
    @inject(SCRAPER_TYPES.WebScraper)
    private readonly _webScraper: WebScraperPort
  ) {}

  async execute(
    request: RunScraperRequest
  ): Promise<ResultEx<RunScraperResponse, ScraperNotFoundError | ScraperRunFailedError | Error>> {
    this._logger.info('run-scraper.start', {
      scraperSourceId: request.scraperSourceId,
      projectId: request.projectId,
    });

    const sourceResult = await this._sourceRepository.findById(request.scraperSourceId);
    if (!sourceResult.isSuccess) {
      return ResultEx.failure(sourceResult.error);
    }
    const source = sourceResult.data;
    if (!source || source.projectId !== request.projectId) {
      return ResultEx.failure(new ScraperNotFoundError(request.scraperSourceId));
    }

    const runEntity = ScraperRunEntity.create(request.scraperSourceId, request.projectId);
    const createRunResult = await this._runRepository.create(runEntity.toData());
    if (!createRunResult.isSuccess) {
      return ResultEx.failure(createRunResult.error);
    }
    let run = ScraperRunEntity.fromData(createRunResult.data);
    run = run.markRunning();
    const updateRunningResult = await this._runRepository.update(run.toData());
    if (!updateRunningResult.isSuccess) {
      return ResultEx.failure(updateRunningResult.error);
    }

    type ResultItem =
      | { url: string; data: Record<string, unknown>; items?: unknown[] }
      | { url: string; error: string };
    const aggregated: ResultItem[] = [];
    for (const url of source.urls) {
      const parseResult = await this._webScraper.parse({
        url,
        type: source.type,
        whatToCollect: source.whatToCollect,
        customSelectors: source.customSelectors,
      });
      if (!parseResult.isSuccess) {
        if (source.stopOnFirstError) {
          run = run.markFailed(parseResult.error.message);
          await this._runRepository.update(run.toData());
          return ResultEx.failure(
            new ScraperRunFailedError(`Failed to parse ${url}: ${parseResult.error.message}`)
          );
        }
        aggregated.push({ url, error: parseResult.error.message });
        continue;
      }
      const items = Array.isArray(parseResult.data.items) ? parseResult.data.items : [];
      aggregated.push({
        url: parseResult.data.url,
        data: parseResult.data.data ?? {},
        items,
      });
    }

    const rawResult = { results: aggregated, collectedAt: new Date().toISOString() };
    const stats = createRunStats(
      source.urls.length,
      aggregated.map((r) =>
        'error' in r ? { error: r.error } : { data: r.data, items: r.items }
      )
    );
    const hasErrors = aggregated.some((r) => 'error' in r && r.error);
    if (hasErrors) {
      const errorCount = aggregated.filter((r) => 'error' in r).length;
      run = run.markPartiallyFailed(
        rawResult,
        `${errorCount} URL(s) failed to parse`,
        stats
      );
    } else {
      run = run.markCompleted(rawResult, stats);
    }
    const updateCompletedResult = await this._runRepository.update(run.toData());
    if (!updateCompletedResult.isSuccess) {
      return ResultEx.failure(updateCompletedResult.error);
    }

    this._logger.info('run-scraper.success', {
      runId: run.id,
      status: run.status,
      stats: run.stats,
    });
    return ResultEx.success({ run: updateCompletedResult.data });
  }
}
