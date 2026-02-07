import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as SCRAPER_TYPES } from '../../infrastructure/bootstrap/types';
import type { ScraperRunRepositoryPort } from '../ports/scraper-run-repository.port';
import type { ScraperSourceRepositoryPort } from '../ports/scraper-source-repository.port';
import type { ScraperInsightsLlmPort } from '../ports/scraper-insights-llm.port';
import { ScraperRunEntity } from '../../domain/entities/scraper-run.entity';
import { ScraperNotFoundError } from '../../domain/errors/scraper.error';
import type {
  GenerateRunInsightsRequest,
  GenerateRunInsightsResponse,
} from './input-output/scraper.io';

@injectable()
export class GenerateRunInsightsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(SCRAPER_TYPES.ScraperRunRepository)
    private readonly _runRepository: ScraperRunRepositoryPort,
    @inject(SCRAPER_TYPES.ScraperSourceRepository)
    private readonly _sourceRepository: ScraperSourceRepositoryPort,
    @inject(SCRAPER_TYPES.ScraperInsightsLlm)
    private readonly _llm: ScraperInsightsLlmPort
  ) {}

  async execute(
    request: GenerateRunInsightsRequest
  ): Promise<ResultEx<GenerateRunInsightsResponse, ScraperNotFoundError | Error>> {
    this._logger.info('generate-run-insights.start', { runId: request.runId });

    const runResult = await this._runRepository.findById(request.runId);
    if (!runResult.isSuccess) {
      return ResultEx.failure(runResult.error);
    }
    const run = runResult.data;
    if (!run || run.projectId !== request.projectId) {
      return ResultEx.failure(new ScraperNotFoundError(request.runId));
    }
    if (run.status !== 'completed' || !run.rawResult) {
      return ResultEx.failure(
        new Error('Run is not completed or has no raw result to analyze')
      );
    }

    let sourceType: string | undefined;
    let researchGoal: string | null | undefined;
    const sourceResult = await this._sourceRepository.findById(run.scraperSourceId);
    if (sourceResult.isSuccess && sourceResult.data) {
      sourceType = sourceResult.data.type;
      researchGoal = sourceResult.data.researchGoal ?? undefined;
    }

    const llmResult = await this._llm.generateInsights({
      rawResult: run.rawResult,
      sourceType,
      researchGoal,
    });
    if (!llmResult.isSuccess) {
      this._logger.error('generate-run-insights.llm-error', { error: llmResult.error.message });
      return ResultEx.failure(llmResult.error);
    }

    const updatedEntity = ScraperRunEntity.fromData(run).withInsightsSummary(llmResult.data);
    const updateResult = await this._runRepository.update(updatedEntity.toData());
    if (!updateResult.isSuccess) {
      return ResultEx.failure(updateResult.error);
    }

    this._logger.info('generate-run-insights.success', { runId: request.runId });
    return ResultEx.success({ run: updateResult.data });
  }
}
