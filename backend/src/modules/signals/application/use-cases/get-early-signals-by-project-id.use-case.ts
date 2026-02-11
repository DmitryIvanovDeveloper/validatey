import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ResponseRepositoryPort } from '../../../responses/application/ports/response-repository.port';
import { TYPES as RESPONSES_TYPES } from '../../../responses/infrastructure/bootstrap/types';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { EarlySignal } from '../../domain/entities/early-signal.entity';
import { EarlySignalsLlmPort } from '../ports/early-signals-llm.port';
import { EarlySignalsRepositoryPort } from '../ports/early-signals-repository.port';
import {
  GetEarlySignalsByProjectIdUseCaseRequest,
  GetEarlySignalsByProjectIdUseCaseResponse,
} from './input-output/get-early-signals-by-project-id.io';

function extractCommentsFromResponses(
  responses: Array<{
    transcript: string | null;
    answers: Record<string, any>;
  }>
): string[] {
  const comments: string[] = [];
  const seen = new Set<string>();

  for (const res of responses) {
    if (res.transcript && typeof res.transcript === 'string' && res.transcript.trim()) {
      const t = res.transcript.trim();
      if (!seen.has(t)) {
        seen.add(t);
        comments.push(t);
      }
    }

    const answers = res.answers;
    if (!answers || typeof answers !== 'object') continue;

    if (answers.quotes && Array.isArray(answers.quotes)) {
      for (const q of answers.quotes) {
        const text = typeof q === 'string' ? q : (q?.text ?? '');
        if (typeof text === 'string' && text.trim()) {
          const t = text.trim();
          if (!seen.has(t)) {
            seen.add(t);
            comments.push(t);
          }
        }
      }
    }

    for (const key of Object.keys(answers)) {
      if (key === 'quotes' || key === 'problemSeverity' || key === 'wtp') continue;
      const val = answers[key];
      if (typeof val === 'string' && val.trim()) {
        const t = val.trim();
        if (!seen.has(t)) {
          seen.add(t);
          comments.push(t);
        }
      }
    }
  }

  return comments;
}

@injectable()
export class GetEarlySignalsByProjectIdUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(RESPONSES_TYPES.ResponseRepository)
    private readonly _responseRepository: ResponseRepositoryPort,
    @inject(TYPES.EarlySignalsLlm)
    private readonly _llmPort: EarlySignalsLlmPort,
    @inject(TYPES.EarlySignalsRepository)
    private readonly _signalsRepository: EarlySignalsRepositoryPort
  ) {}

  async execute(
    request: GetEarlySignalsByProjectIdUseCaseRequest
  ): Promise<ResultEx<GetEarlySignalsByProjectIdUseCaseResponse, Error>> {
    this._logger.info('get-early-signals-by-project-id.start', { projectId: request.projectId });

    try {
      const responsesResult = await this._responseRepository.findByProjectId(request.projectId);
      if (!responsesResult.isSuccess) {
        this._logger.error('get-early-signals-by-project-id.responses-error', {
          projectId: request.projectId,
          error: responsesResult.error,
        });
        return ResultEx.failure(responsesResult.error);
      }

      const responses = responsesResult.data;
      const comments = extractCommentsFromResponses(
        responses.map((r) => ({ transcript: r.transcript, answers: r.answers }))
      );

      if (comments.length === 0) {
        this._logger.info('get-early-signals-by-project-id.no-comments', {
          projectId: request.projectId,
        });
        return ResultEx.success({ signals: [] });
      }

      const llmResult = await this._llmPort.analyzeComments(comments);
      if (!llmResult.isSuccess) {
        this._logger.error('get-early-signals-by-project-id.llm-error', {
          projectId: request.projectId,
          error: llmResult.error,
        });
        return ResultEx.failure(llmResult.error);
      }

      const signals: EarlySignal[] = llmResult.data;

      const saveResult = await this._signalsRepository.save(request.projectId, signals);
      if (!saveResult.isSuccess) {
        this._logger.error('get-early-signals-by-project-id.save-error', {
          projectId: request.projectId,
          error: saveResult.error,
        });
        return ResultEx.failure(saveResult.error);
      }

      this._logger.info('get-early-signals-by-project-id.success', {
        projectId: request.projectId,
        signalsCount: signals.length,
      });

      return ResultEx.success({ signals });
    } catch (error) {
      this._logger.error('get-early-signals-by-project-id.exception', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error),
      });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
