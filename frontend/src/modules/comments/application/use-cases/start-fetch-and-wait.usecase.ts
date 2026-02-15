import { injectable, inject } from 'inversify';
import type { CommentsHttpRepositoryPort, FetchJobStateDTO } from '../ports/comments-http-repository.port';
import { COMMENT_TYPES } from '../../types';
import Result from '../../../../infrastructure/result/result';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface StartFetchAndWaitInput {
  projectId: string;
  sourceType: 'reddit' | 'hackernews';
  redditUrls?: string[];
  hnFeedType?: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
  hnUrls?: string[];
  periodDays?: number;
}

export interface StartFetchAndWaitOptions {
  onProgress?: (state: FetchJobStateDTO) => void;
  pollIntervalMs?: number;
}

@injectable()
export class StartFetchAndWaitUseCase {
  private static readonly DEFAULT_POLL_MS = 2500;
  private static readonly MAX_WAIT_TIME_MS = 30000; // 30 seconds timeout

  constructor(
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _repository: CommentsHttpRepositoryPort
  ) {}

  public async execute(
    input: StartFetchAndWaitInput,
    options?: StartFetchAndWaitOptions
  ): Promise<Result<FetchJobStateDTO, Error>> {
    const pollIntervalMs = options?.pollIntervalMs ?? StartFetchAndWaitUseCase.DEFAULT_POLL_MS;
    const onProgress = options?.onProgress;
    const startTime = Date.now();

    const startResult = await this._repository.startFetch(input.projectId, {
      sourceType: input.sourceType,
      redditUrls: input.redditUrls,
      hnFeedType: input.hnFeedType,
      hnUrls: input.hnUrls,
      periodDays: input.periodDays,
    });

    if (!startResult.isSuccess) {
      return Result.failure<FetchJobStateDTO, Error>(startResult.error ?? new Error('Failed to start fetch'));
    }

    if (!startResult.data?.started) {
      return Result.failure<FetchJobStateDTO, Error>(new Error('Fetch was not started (e.g. already running)'));
    }

    while (Date.now() - startTime < StartFetchAndWaitUseCase.MAX_WAIT_TIME_MS) {
      await delay(pollIntervalMs);

      const statusResult = await this._repository.getFetchStatus();

      if (!statusResult.isSuccess) {
        return Result.failure<FetchJobStateDTO, Error>(statusResult.error ?? new Error('Failed to get status'));
      }

      const state = statusResult.data;
      onProgress?.(state);

      if (state.status === 'completed') {
        return Result.success<FetchJobStateDTO>(state);
      }

      if (state.status === 'failed') {
        return Result.failure<FetchJobStateDTO, Error>(
          new Error(state.error ?? 'Fetch failed')
        );
      }
    }

    // Timeout reached - return the last known state
    const finalStatusResult = await this._repository.getFetchStatus();
    if (finalStatusResult.isSuccess) {
      const state = finalStatusResult.data;
      if (state.status === 'completed') {
        return Result.success<FetchJobStateDTO>(state);
      }
      // Even if still running, return success so UI can reload comments
      return Result.success<FetchJobStateDTO>({ ...state, status: 'completed' as const });
    }

    return Result.failure<FetchJobStateDTO, Error>(new Error('Fetch timeout - please refresh the page'));
  }
}