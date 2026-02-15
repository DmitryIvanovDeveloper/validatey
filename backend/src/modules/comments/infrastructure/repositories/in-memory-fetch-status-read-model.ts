import { injectable } from 'inversify';
import { FetchStatusReadModelPort, FetchJobState } from '../../application/ports/fetch-status-read-model.port';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentError } from '../../domain/errors/comment.error';

@injectable()
export class InMemoryFetchStatusReadModel implements FetchStatusReadModelPort {
  private readonly _jobs = new Map<string, FetchJobState>();

  updateFromEvent(eventType: string, payload: any): void {
    switch (eventType) {
      case 'FetchStartedEvent':
        this._jobs.set(payload.jobId, {
          jobId: payload.jobId,
          status: 'running',
          commentsCount: 0,
          startedAt: new Date(payload.startedAt),
        });
        break;

      case 'FetchProgressEvent':
        const existingJob = this._jobs.get(payload.jobId);
        if (existingJob) {
          this._jobs.set(payload.jobId, {
            ...existingJob,
            commentsCount: payload.commentsCountSoFar,
            currentSourceName: payload.currentSourceName,
          });
        }
        break;

      case 'FetchCompletedEvent':
        const completedJob = this._jobs.get(payload.jobId);
        if (completedJob) {
          this._jobs.set(payload.jobId, {
            ...completedJob,
            status: 'completed',
            commentsCount: payload.commentsCount,
            completedAt: new Date(payload.fetchedAt),
          });
        }
        break;

      case 'FetchFailedEvent':
        const failedJob = this._jobs.get(payload.jobId);
        if (failedJob) {
          this._jobs.set(payload.jobId, {
            ...failedJob,
            status: 'failed',
            error: payload.error,
            completedAt: new Date(payload.completedAt),
          });
        }
        break;
    }
  }

  async getStatus(jobId?: string): Promise<ResultEx<FetchJobState[], CommentError>> {
    try {
      if (jobId) {
        const job = this._jobs.get(jobId);
        return ResultEx.success(job ? [job] : []);
      }

      // Return all jobs, sorted by most recent first
      const jobs = Array.from(this._jobs.values())
        .sort((a, b) => {
          const aTime = a.startedAt || a.completedAt || new Date(0);
          const bTime = b.startedAt || b.completedAt || new Date(0);
          return bTime.getTime() - aTime.getTime();
        });

      return ResultEx.success(jobs);
    } catch (error) {
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }

  async getLatestStatus(): Promise<ResultEx<FetchJobState | null, CommentError>> {
    try {
      const jobs = Array.from(this._jobs.values());
      if (jobs.length === 0) {
        return ResultEx.success(null);
      }

      // Find the most recent job
      const latestJob = jobs.reduce((latest, current) => {
        const latestTime = latest.startedAt || latest.completedAt || new Date(0);
        const currentTime = current.startedAt || current.completedAt || new Date(0);
        return currentTime > latestTime ? current : latest;
      });

      return ResultEx.success(latestJob);
    } catch (error) {
      return ResultEx.failure(new CommentError(
        error instanceof Error ? error.message : 'Unknown error occurred'
      ));
    }
  }
}