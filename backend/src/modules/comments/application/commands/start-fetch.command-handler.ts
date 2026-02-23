import { injectable, inject } from 'inversify';
import { COMMENT_TYPES } from '../../types';
import { FetchCommentsUseCase } from '../use-cases/fetch-comments.usecase';
import { FetchJobRepositoryPort } from '../ports/fetch-job-repository.port';
import { CommentSourceRepositoryPort } from '../ports/comment-source-repository.port';
import type { StartFetchCommand } from './start-fetch.command';
import { EventBusPort } from '../../../../infrastructure/event-bus/ports/event-bus.port';
import { TYPES } from '../../../../infrastructure/bootstrap/types';
import ResultEx from '../../../../infrastructure/result/result';
import { CommentSourceValueObject } from '../../domain/value-objects/comment-source.vo';
import {
  FETCH_STARTED_EVENT,
  FETCH_PROGRESS_EVENT,
  FETCH_COMPLETED_EVENT,
  FETCH_FAILED_EVENT,
} from '../../domain/events/event-names';

@injectable()
export class StartFetchCommandHandler {
  constructor(
    @inject(TYPES.Logger)
    private readonly _logger: any, // TODO: Use proper LoggerPort type
    @inject(COMMENT_TYPES.FetchCommentsUseCase)
    private readonly _fetchCommentsUseCase: FetchCommentsUseCase,
    @inject(COMMENT_TYPES.FetchJobRepository)
    private readonly _fetchJobRepository: FetchJobRepositoryPort,
    @inject(COMMENT_TYPES.CommentSourceRepository)
    private readonly _sourceRepository: CommentSourceRepositoryPort,
    @inject(TYPES.EventBus)
    private readonly _eventBus: EventBusPort
  ) {}

  async execute(command: StartFetchCommand): Promise<ResultEx<void, Error>> {
    try {
      console.log(`[StartFetch Handler] Starting execution with command:`, JSON.stringify(command, null, 2));
      
      // Check if jobs are enabled via environment variable
      // Default to true for backward compatibility
      const useJobs = process.env.COMMENT_FETCH_USE_JOBS !== 'false';
      console.log(`[StartFetch Handler] Using ${useJobs ? 'job-based' : 'direct'} execution mode`);
      
      // If sourceId is provided, run job for that specific source
      if (command.sourceId) {
        const sourceResult = await this._sourceRepository.findById(command.sourceId);
        if (!sourceResult.isSuccess) {
          return ResultEx.failure(new Error(`Source not found: ${command.sourceId}`));
        }

        const source = sourceResult.data;
        const config = {
          sourceType: source.sourceType as 'reddit' | 'hackernews',
          redditUrls: source.redditUrl ? [source.redditUrl] : [],
          hnFeedType: source.hnFeedType as any,
          periodDays: command.periodDays,
        };
        
        if (useJobs) {
          this._runJobForSource(source.id, source.projectId, config);
        } else {
          await this._runDirectFetch(source.id, source.projectId, config);
        }
        return ResultEx.success(undefined);
      }

      // If projectId and source details are provided, create sources and run jobs for them
      if (command.projectId && command.sourceType) {
        if (command.sourceType === 'reddit' && command.redditUrls) {
          // Create jobs for each Reddit URL
          for (const redditUrl of command.redditUrls) {
            const trimmedUrl = redditUrl.trim();
            if (!trimmedUrl) continue;

            const sourceResult = await this._createOrGetSourceForUrl(command.projectId!, 'reddit', trimmedUrl);
            if (!sourceResult.isSuccess) {
              this._logger.error('Failed to create source for URL', { url: trimmedUrl, error: sourceResult.error });
              continue; // Continue with other URLs even if one fails
            }

            const source = sourceResult.data;
            const config = {
              sourceType: 'reddit' as const,
              redditUrls: [trimmedUrl],
              periodDays: command.periodDays,
            };
            
            if (useJobs) {
              this._runJobForSource(source.id, source.projectId!, config);
            } else {
              await this._runDirectFetch(source.id, source.projectId!, config);
            }
          }
          return ResultEx.success(undefined);
        } else if (command.sourceType === 'hackernews') {
          // Check if we have HN URLs
          if (command.hnUrls && command.hnUrls.length > 0) {
            // Process each HN URL
            console.log(`[StartFetch Handler] Processing ${command.hnUrls.length} HN URLs`);
            for (const hnUrl of command.hnUrls) {
              console.log(`[StartFetch Handler] Processing HN URL: ${hnUrl}`);
              const sourceResult = await this._createOrGetSourceForHnUrl(command.projectId, hnUrl);
              if (!sourceResult.isSuccess) {
                console.log(`[StartFetch Handler] Failed to create/get source for ${hnUrl}:`, sourceResult.error);
                return ResultEx.failure(sourceResult.error);
              }

              const source = sourceResult.data;
              console.log(`[StartFetch Handler] Created source ${source.id} for HN URL ${hnUrl}`);
              
              const config = {
                sourceType: 'hackernews' as const,
                hnUrl: hnUrl,
                periodDays: command.periodDays,
              };
              
              if (useJobs) {
                this._runJobForSource(source.id, source.projectId, config);
                console.log(`[StartFetch Handler] Started job for source ${source.id}`);
              } else {
                await this._runDirectFetch(source.id, source.projectId, config);
                console.log(`[StartFetch Handler] Completed direct fetch for source ${source.id}`);
              }
            }
          } else if (command.hnFeedType) {
            // Create job for Hacker News feed
            const sourceResult = await this._createOrGetSourceForFeed(command.projectId, 'hackernews', command.hnFeedType);
            if (!sourceResult.isSuccess) {
              return ResultEx.failure(sourceResult.error);
            }

            const source = sourceResult.data;
            const config = {
              sourceType: 'hackernews' as const,
              hnFeedType: command.hnFeedType,
              periodDays: command.periodDays,
            };
            
            if (useJobs) {
              this._runJobForSource(source.id, source.projectId, config);
            } else {
              await this._runDirectFetch(source.id, source.projectId, config);
            }
          } else {
            return ResultEx.failure(new Error('Hacker News feed type or URLs are required'));
          }
          return ResultEx.success(undefined);
        }
      }

      // If projectId is provided without source details, run jobs for all existing sources in that project
      if (command.projectId) {
        const sourcesResult = await this._sourceRepository.findByProjectId(command.projectId);
        if (!sourcesResult.isSuccess) {
          return ResultEx.failure(sourcesResult.error);
        }

        const sources = sourcesResult.data;
        for (const source of sources) {
          const config = {
            sourceType: source.sourceType as 'reddit' | 'hackernews',
            redditUrls: source.redditUrl ? [source.redditUrl] : [],
            hnFeedType: source.hnFeedType as any,
            periodDays: command.periodDays,
          };
          
          if (useJobs) {
            this._runJobForSource(source.id, source.projectId, config);
          } else {
            await this._runDirectFetch(source.id, source.projectId, config);
          }
        }
        return ResultEx.success(undefined);
      }

      // If no specific source or project, run for all active sources
      const allSourcesResult = await this._sourceRepository.findAll();
      if (!allSourcesResult.isSuccess) {
        return ResultEx.failure(allSourcesResult.error);
      }

      const allSources = allSourcesResult.data;
      for (const source of allSources) {
        const config = {
          sourceType: source.sourceType as 'reddit' | 'hackernews',
          redditUrls: source.redditUrl ? [source.redditUrl] : [],
          hnFeedType: source.hnFeedType as any,
          periodDays: command.periodDays,
        };
        
        if (useJobs) {
          this._runJobForSource(source.id, source.projectId, config);
        } else {
          await this._runDirectFetch(source.id, source.projectId, config);
        }
      }

      return ResultEx.success(undefined);
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Runs fetch directly without job system (for environments like Vercel where jobs don't work)
   */
  private async _runDirectFetch(
    sourceId: string,
    projectId: string,
    config: {
      sourceType: 'reddit' | 'hackernews';
      redditUrls?: string[];
      hnFeedType?: any;
      hnUrl?: string;
      periodDays?: number;
    }
  ): Promise<void> {
    try {
      console.log(`[RunDirectFetch] ==========================================`);
      console.log(`[RunDirectFetch] Starting direct fetch for source ${sourceId}`);
      console.log(`[RunDirectFetch] Project ID: ${projectId}`);
      console.log(`[RunDirectFetch] Config:`, JSON.stringify(config, null, 2));
      console.log(`[RunDirectFetch] Environment: VERCEL=${process.env.VERCEL}, COMMENT_FETCH_USE_JOBS=${process.env.COMMENT_FETCH_USE_JOBS}`);
      const startedAt = new Date();
      console.log(`[RunDirectFetch] Started at: ${startedAt.toISOString()}`);
      
      // Run the fetch directly (synchronously)
      const result = await this._fetchCommentsUseCase.execute({
        sourceId,
        projectId,
        sourceType: config.sourceType,
        redditUrls: config.redditUrls,
        hnFeedType: config.hnFeedType,
        periodDays: config.periodDays,
      });

      const completedAt = new Date();
      const duration = completedAt.getTime() - startedAt.getTime();

      if (result.isSuccess) {
        console.log(`[RunDirectFetch] ✅ Successfully fetched ${result.data.commentsCount} comments for source ${sourceId}`);
        console.log(`[RunDirectFetch] Duration: ${Math.round(duration / 1000)}s`);
        console.log(`[RunDirectFetch] Completed at: ${completedAt.toISOString()}`);
      } else {
        console.error(`[RunDirectFetch] ❌ Fetch failed for source ${sourceId}:`, result.error.message);
        if (result.error.stack) {
          console.error(`[RunDirectFetch] Stack trace:`, result.error.stack);
        }
      }
      console.log(`[RunDirectFetch] ==========================================`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error(`[RunDirectFetch] ❌ Exception during fetch for source ${sourceId}:`, errorMessage);
      if (errorStack) {
        console.error(`[RunDirectFetch] Stack trace:`, errorStack);
      }
      console.log(`[RunDirectFetch] ==========================================`);
    }
  }

  /**
   * Runs fetch using job system (original behavior with job tracking and events)
   */
  private _runJobForSource(
    sourceId: string,
    projectId: string,
    config: {
      sourceType: 'reddit' | 'hackernews';
      redditUrls?: string[];
      hnFeedType?: any;
      hnUrl?: string;
      periodDays?: number;
    }
  ): void {
    console.log(`[RunJobForSource] Starting job for source ${sourceId}, config:`, JSON.stringify(config, null, 2));

    // Create fetch job record
    this._fetchJobRepository.create({
      sourceId,
      projectId,
      status: 'running',
    }).then(jobResult => {
      if (!jobResult.isSuccess) {
        console.error('Failed to create fetch job:', jobResult.error);
        return;
      }

      const jobId = jobResult.data.id;
      const startedAt = new Date();

      // Emit started event
      this._eventBus.emit(FETCH_STARTED_EVENT, {
        jobId,
        sourceId,
        projectId,
        sourceType: config.sourceType,
        redditUrls: config.redditUrls,
        hnFeedType: config.hnFeedType,
        periodDays: config.periodDays || null,
        startedAt,
      });

      // Update job with start time
      this._fetchJobRepository.update(jobId, { startedAt });

      // Run the fetch
      this._fetchCommentsUseCase.execute({
        sourceId,
        projectId,
        sourceType: config.sourceType,
        redditUrls: config.redditUrls,
        hnFeedType: config.hnFeedType,
        periodDays: config.periodDays,
      }, (progress) => {
        // Emit progress event
        this._eventBus.emit(FETCH_PROGRESS_EVENT, {
          jobId,
          commentsCountSoFar: progress.commentsCountSoFar,
          currentSourceName: progress.currentSourceName,
        });
      }).then(result => {
        const completedAt = new Date();

        if (result.isSuccess) {
          // Update job as completed
          this._fetchJobRepository.update(jobId, {
            status: 'completed',
            completedAt,
            commentsCount: result.data.commentsCount,
          });

          // Emit completed event
          this._eventBus.emit(FETCH_COMPLETED_EVENT, {
            jobId,
            success: result.data.success,
            commentsCount: result.data.commentsCount,
            commentsBySource: result.data.commentsBySource,
            errors: result.data.errors,
            fetchedAt: result.data.fetchedAt,
          });
        } else {
          // Update job as failed
          this._fetchJobRepository.update(jobId, {
            status: 'failed',
            completedAt,
            errorMessage: result.error.message,
          });

          // Emit failed event
          this._eventBus.emit(FETCH_FAILED_EVENT, {
            jobId,
            error: result.error.message,
            completedAt,
          });
        }
      }).catch(error => {
        const completedAt = new Date();
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Update job as failed
        this._fetchJobRepository.update(jobId, {
          status: 'failed',
          completedAt,
          errorMessage,
        });

        // Emit failed event
        this._eventBus.emit(FETCH_FAILED_EVENT, {
          jobId,
          error: errorMessage,
          completedAt,
        });
      });
    }).catch(error => {
      console.error('Failed to create fetch job record:', error);
    });
  }

  private async _createOrGetSourceForUrl(projectId: string, sourceType: 'reddit', redditUrl: string): Promise<ResultEx<{ id: string; projectId: string; sourceType: string; redditUrls?: string[]; hnFeedType?: string }, Error>> {
    try {
      console.log(`[CreateOrGetSourceForUrl] Creating/getting source for URL: ${redditUrl}, projectId: ${projectId}`);
      const sourceValueObject = CommentSourceValueObject.createReddit(redditUrl);
      console.log(`[CreateOrGetSourceForUrl] Parsed source value object:`, {
        postId: sourceValueObject.postId,
        subredditName: sourceValueObject.subredditName,
        redditUrl: sourceValueObject.redditUrl
      });

      // Check if source already exists
      console.log(`[CreateOrGetSourceForUrl] Checking for existing sources in project`);
      const existingSources = await this._sourceRepository.findByProjectId(projectId);
      if (!existingSources.isSuccess) {
        console.error(`[CreateOrGetSourceForUrl] Failed to check existing sources:`, existingSources.error);
        return ResultEx.failure(new Error('Failed to check existing sources'));
      }

      console.log(`[CreateOrGetSourceForUrl] Found ${existingSources.data.length} existing sources`);
      const existingSource = existingSources.data.find(s =>
        s.redditUrl === redditUrl && s.sourceType === 'reddit'
      );

      if (existingSource) {
        console.log(`[CreateOrGetSourceForUrl] Found existing source:`, {
          id: existingSource.id,
          postId: existingSource.postId,
          subredditName: existingSource.subredditName
        });
        return ResultEx.success({
          id: existingSource.id,
          projectId: existingSource.projectId,
          sourceType: existingSource.sourceType,
          redditUrl: existingSource.redditUrl,
          hnFeedType: existingSource.hnFeedType,
        });
      }

      // Create new source
      console.log(`[CreateOrGetSourceForUrl] Creating new source with:`, {
        projectId,
        sourceType: 'reddit',
        redditUrl,
        postId: sourceValueObject.postId,
        subredditName: sourceValueObject.subredditName
      });
      const createResult = await this._sourceRepository.create({
        projectId,
        sourceType: 'reddit',
        redditUrl,
        subredditName: sourceValueObject.subredditName,
        postId: sourceValueObject.postId,
      });
      
      console.log(`[CreateOrGetSourceForUrl] Create result:`, {
        success: createResult.isSuccess,
        id: createResult.isSuccess ? createResult.data.id : null,
        postId: createResult.isSuccess ? createResult.data.postId : null,
        subredditName: createResult.isSuccess ? createResult.data.subredditName : null
      });

      if (!createResult.isSuccess) {
        return ResultEx.failure(new Error('Failed to create comment source'));
      }

      return ResultEx.success({
        id: createResult.data.id,
        projectId,
        sourceType: 'reddit',
        redditUrl,
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private async _createOrGetSourceForFeed(projectId: string, sourceType: 'hackernews', hnFeedType: string): Promise<ResultEx<{ id: string; projectId: string; sourceType: string; redditUrls?: string[]; hnFeedType?: string }, Error>> {
    try {
      const sourceValueObject = CommentSourceValueObject.createHackerNews(hnFeedType as any);

      // Check if source already exists
      const existingSources = await this._sourceRepository.findByProjectId(projectId);
      if (!existingSources.isSuccess) {
        return ResultEx.failure(new Error('Failed to check existing sources'));
      }

      const existingSource = existingSources.data.find(s =>
        s.hnFeedType === hnFeedType && s.sourceType === 'hackernews' && !s.hnUrl
      );

      if (existingSource) {
        return ResultEx.success({
          id: existingSource.id,
          projectId: existingSource.projectId,
          sourceType: existingSource.sourceType,
          redditUrls: existingSource.redditUrl ? [existingSource.redditUrl] : [],
          hnFeedType: existingSource.hnFeedType,
        });
      }

      // Create new source
      const createResult = await this._sourceRepository.create({
        projectId,
        sourceType: 'hackernews',
        hnFeedType,
      });

      if (!createResult.isSuccess) {
        return ResultEx.failure(new Error('Failed to create comment source'));
      }

      return ResultEx.success({
        id: createResult.data.id,
        projectId,
        sourceType: 'hackernews',
        hnFeedType,
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private async _createOrGetSourceForHnUrl(projectId: string, hnUrl: string): Promise<ResultEx<{ id: string; projectId: string; sourceType: string; hnUrl?: string; hnItemId?: string }, Error>> {
    try {
      console.log(`[CreateOrGetSourceForHnUrl] Creating source for URL: ${hnUrl}`);
      const sourceValueObject = CommentSourceValueObject.createHackerNews(hnUrl);
      console.log(`[CreateOrGetSourceForHnUrl] Source value object:`, {
        type: sourceValueObject.type,
        hnUrl: sourceValueObject.hnUrl,
        hnItemId: sourceValueObject.hnItemId
      });

      // Check if source already exists
      const existingSources = await this._sourceRepository.findByProjectId(projectId);
      if (!existingSources.isSuccess) {
        return ResultEx.failure(new Error('Failed to check existing sources'));
      }

      const existingSource = existingSources.data.find(s =>
        s.hnUrl === hnUrl && s.sourceType === 'hackernews'
      );

      if (existingSource) {
        return ResultEx.success({
          id: existingSource.id,
          projectId: existingSource.projectId,
          sourceType: existingSource.sourceType,
          hnUrl: existingSource.hnUrl,
          hnItemId: existingSource.hnItemId,
        });
      }

      // Create new source
      const createResult = await this._sourceRepository.create({
        projectId,
        sourceType: 'hackernews',
        hnUrl,
        hnItemId: sourceValueObject.hnItemId,
      });

      if (!createResult.isSuccess) {
        return ResultEx.failure(new Error('Failed to create comment source'));
      }

      return ResultEx.success({
        id: createResult.data.id,
        projectId,
        sourceType: 'hackernews',
        hnUrl,
        hnItemId: sourceValueObject.hnItemId,
      });
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private async _createOrGetSource(command: StartFetchCommand): Promise<ResultEx<{ id: string; projectId: string; sourceType: string; redditUrls?: string[]; hnFeedType?: string }, Error>> {
    try {
      // For Reddit
      if (command.sourceType === 'reddit') {
        if (!command.redditUrls || command.redditUrls.length === 0) {
          return ResultEx.failure(new Error('Reddit URLs are required'));
        }

        if (!command.projectId) {
          return ResultEx.failure(new Error('Project ID is required'));
        }

        const sourceValueObject = CommentSourceValueObject.createReddit(command.redditUrls[0]);

        // Check if source already exists
        const existingSources = await this._sourceRepository.findByProjectId(command.projectId);
        if (!existingSources.isSuccess) {
          return ResultEx.failure(new Error('Failed to check existing sources'));
        }

        const existingSource = existingSources.data.find(s =>
          s.redditUrl === command.redditUrls?.[0] && s.sourceType === 'reddit'
        );

        if (existingSource) {
          return ResultEx.success({
            id: existingSource.id,
            projectId: existingSource.projectId,
            sourceType: existingSource.sourceType,
            redditUrls: existingSource.redditUrl ? [existingSource.redditUrl] : [],
            hnFeedType: existingSource.hnFeedType,
          });
        }

        // Create new source
        const createResult = await this._sourceRepository.create({
          projectId: command.projectId!,
          sourceType: 'reddit',
          redditUrl: command.redditUrls[0],
          subredditName: sourceValueObject.subredditName,
          postId: sourceValueObject.postId,
        });

        if (!createResult.isSuccess) {
          return ResultEx.failure(new Error('Failed to create comment source'));
        }

        return ResultEx.success({
          id: createResult.data.id,
          projectId: command.projectId!,
          sourceType: 'reddit',
          redditUrls: [command.redditUrls[0]],
        });
      }

      // For Hacker News
      if (command.sourceType === 'hackernews') {
        if (!command.hnFeedType) {
          return ResultEx.failure(new Error('Hacker News feed type is required'));
        }

        if (!command.projectId) {
          return ResultEx.failure(new Error('Project ID is required'));
        }

        const sourceValueObject = CommentSourceValueObject.createHackerNews(command.hnFeedType);

        // Check if source already exists
        const existingSources = await this._sourceRepository.findByProjectId(command.projectId);
        if (!existingSources.isSuccess) {
          return ResultEx.failure(new Error('Failed to check existing sources'));
        }

        const existingSource = existingSources.data.find(s =>
          s.hnFeedType === command.hnFeedType && s.sourceType === 'hackernews'
        );

        if (existingSource) {
          return ResultEx.success({
            id: existingSource.id,
            projectId: existingSource.projectId,
            sourceType: existingSource.sourceType,
            redditUrls: existingSource.redditUrl ? [existingSource.redditUrl] : [],
            hnFeedType: existingSource.hnFeedType,
          });
        }

        // Create new source
        const createResult = await this._sourceRepository.create({
          projectId: command.projectId!,
          sourceType: 'hackernews',
          hnFeedType: command.hnFeedType,
        });

        if (!createResult.isSuccess) {
          return ResultEx.failure(new Error('Failed to create comment source'));
        }

        return ResultEx.success({
          id: createResult.data.id,
          projectId: command.projectId!,
          sourceType: 'hackernews',
          hnFeedType: command.hnFeedType,
        });
      }

      return ResultEx.failure(new Error('Unsupported source type'));
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}