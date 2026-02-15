import { injectable, inject } from 'inversify';
import { StartFetchAndWaitUseCase } from '../../application/use-cases/start-fetch-and-wait.usecase';
import { GetFetchStatusUseCase } from '../../application/use-cases/get-fetch-status.usecase';
import { GetCommentsUseCase, CommentItem } from '../../application/use-cases/get-comments.usecase';
import { DeleteSourceUseCase } from '../../application/use-cases/delete-source.usecase';
import { COMMENT_TYPES } from '../../types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { FetchJobStateDTO } from '../../application/ports/comments-http-repository.port';

export interface CommentsViewModel {
  isLoading: boolean;
  isFetching: boolean;
  comments: CommentItem[];
  commentsForUrl: CommentItem[]; // Comments loaded for specific URL
  fetchProgress: FetchJobStateDTO | null;
  error: string | null;
  redditUrls: string[];
  hnFeedType: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
  hnUrls: string[];
}

@injectable()
export class CommentsPresenter {
  public viewModel: CommentsViewModel = {
    isLoading: false,
    isFetching: false,
    comments: [],
    commentsForUrl: [],
    fetchProgress: null,
    error: null,
    redditUrls: [],
    hnFeedType: 'top',
    hnUrls: [],
  };

  constructor(
    @inject(COMMENT_TYPES.StartFetchAndWaitUseCase)
    private readonly _startFetchAndWaitUseCase: StartFetchAndWaitUseCase,
    @inject(COMMENT_TYPES.GetFetchStatusUseCase)
    private readonly _getFetchStatusUseCase: GetFetchStatusUseCase,
    @inject(COMMENT_TYPES.GetCommentsUseCase)
    private readonly _getCommentsUseCase: GetCommentsUseCase,
    @inject(COMMENT_TYPES.DeleteSourceUseCase)
    private readonly _deleteSourceUseCase: DeleteSourceUseCase,
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async loadComments(projectId: string): Promise<void> {
    try {
      this.viewModel.isLoading = true;
      this.viewModel.error = null;

      const result = await this._getCommentsUseCase.execute({ projectId });

      if (result.isSuccess) {
        this.viewModel.comments = result.data.comments;
      } else {
        this.viewModel.error = result.error.message;
        this._logger.error('Failed to load comments', { projectId, error: result.error });
      }
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to load comments';
      this._logger.error('Exception loading comments', { projectId, error });
    } finally {
      this.viewModel.isLoading = false;
    }
  }

  async loadCommentsByUrl(projectId: string, url: string): Promise<void> {
    try {
      this.viewModel.isLoading = true;
      this.viewModel.error = null;

      const result = await this._getCommentsUseCase.execute({
        projectId,
        url,
        limit: 100 // Limit to prevent loading too many comments at once
      });

      if (result.isSuccess) {
        // Backend already filtered comments by URL, so we can just use them directly
        this.viewModel.commentsForUrl = result.data.comments;
      } else {
        this.viewModel.error = result.error.message;
        this._logger.error('Failed to load comments by URL', { projectId, url, error: result.error });
      }
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to load comments by URL';
      this._logger.error('Exception loading comments by URL', { projectId, url, error });
    } finally {
      this.viewModel.isLoading = false;
    }
  }

  async deleteSourceByUrl(projectId: string, url: string): Promise<void> {
    try {
      this.viewModel.error = null;

      // Get all sources for this project to find the matching sourceId
      const sourcesResult = await this._getCommentsUseCase.getCommentSources?.(projectId);
      if (!sourcesResult || !sourcesResult.isSuccess) {
        this.viewModel.error = 'Failed to find source to delete';
        return;
      }

      // Find source by URL
      const source = sourcesResult.data.find(s =>
        s.redditUrl === url || s.hnUrl === url
      );

      if (!source) {
        this.viewModel.error = 'Source not found';
        return;
      }

      // Delete the source
      const deleteResult = await this._deleteSourceUseCase.execute(projectId, source.id);
      if (!deleteResult.isSuccess) {
        this.viewModel.error = deleteResult.error.message;
        this._logger.error('Failed to delete source', { projectId, sourceId: source.id, error: deleteResult.error });
        return;
      }

      // Remove from UI arrays based on URL pattern
      if (url.includes('reddit.com') || url.startsWith('r/') || url.match(/^\/?r\/[a-zA-Z0-9_]+\/?$/)) {
        const index = this.viewModel.redditUrls.indexOf(url);
        if (index !== -1) {
          this.viewModel.redditUrls.splice(index, 1);
          this.saveUrlsToStorage(projectId);
        }
      } else if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) {
        const index = this.viewModel.hnUrls.indexOf(url);
        if (index !== -1) {
          this.viewModel.hnUrls.splice(index, 1);
          this.saveUrlsToStorage(projectId);
        }
      }

      // Reload comments to reflect the changes
      await this.loadComments(projectId);

    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to delete source';
      this._logger.error('Exception deleting source', { projectId, url, error });
    }
  }

  async startFetch(projectId: string): Promise<void> {
    try {
      this.viewModel.isFetching = true;
      this.viewModel.error = null;
      this.viewModel.fetchProgress = null;

      const input = {
        projectId,
        // Send both arrays - backend will process them separately
        redditUrls: this.viewModel.redditUrls.length > 0 ? this.viewModel.redditUrls : undefined,
        hnFeedType: this.viewModel.hnUrls.length === 0 ? this.viewModel.hnFeedType : undefined,
        hnUrls: this.viewModel.hnUrls.length > 0 ? this.viewModel.hnUrls : undefined,
        periodDays: 30, // Default to last 30 days
      };

      const result = await this._startFetchAndWaitUseCase.execute(input, {
        onProgress: (progress) => {
          this.viewModel.fetchProgress = progress;
        },
      });

      if (result.isSuccess) {
        // Reload comments after successful fetch
        await this.loadComments(projectId);
      } else {
        this.viewModel.error = result.error.message;
        this._logger.error('Failed to fetch comments', { projectId, input, error: result.error });
      }
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to fetch comments';
      this._logger.error('Exception fetching comments', { projectId, error });
    } finally {
      this.viewModel.isFetching = false;
      this.viewModel.fetchProgress = null;
    }
  }


  // Initialize URLs from storage when presenter is created
  initialize(projectId?: string): void {
    this.loadUrlsFromStorage(projectId);
  }

  // Load URLs for a specific project
  loadUrlsForProject(projectId: string): void {
    this.loadUrlsFromStorage(projectId);
  }

  setRedditUrl(url: string): void {
    this.viewModel.redditUrl = url;
  }

  setHnFeedType(feedType: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments'): void {
    this.viewModel.hnFeedType = feedType;
  }

  addRedditUrl(url: string, projectId?: string): void {
    if (url.trim() && !this.viewModel.redditUrls.includes(url.trim())) {
      this.viewModel.redditUrls.push(url.trim());
      this.saveUrlsToStorage(projectId);
    }
  }

  removeRedditUrl(index: number, projectId?: string): void {
    this.viewModel.redditUrls.splice(index, 1);
    this.saveUrlsToStorage(projectId);
  }

  updateRedditUrl(index: number, url: string, projectId?: string): void {
    this.viewModel.redditUrls[index] = url.trim();
    this.saveUrlsToStorage(projectId);
  }

  addHnUrl(url: string, projectId?: string): void {
    if (url.trim() && !this.viewModel.hnUrls.includes(url.trim())) {
      this.viewModel.hnUrls.push(url.trim());
      this.saveUrlsToStorage(projectId);
    }
  }

  removeHnUrl(index: number, projectId?: string): void {
    this.viewModel.hnUrls.splice(index, 1);
    this.saveUrlsToStorage(projectId);
  }

  updateHnUrl(index: number, url: string, projectId?: string): void {
    if (index >= 0 && index < this.viewModel.hnUrls.length) {
      this.viewModel.hnUrls[index] = url.trim();
      this.saveUrlsToStorage(projectId);
    }
  }

  private saveUrlsToStorage(projectId?: string): void {
    try {
      // Save Reddit URLs
      const redditKey = projectId ? `comments-reddit-urls-${projectId}` : `comments-reddit-urls`;
      localStorage.setItem(redditKey, JSON.stringify(this.viewModel.redditUrls));

      // Save Hacker News URLs
      const hnKey = projectId ? `comments-hn-urls-${projectId}` : `comments-hn-urls`;
      localStorage.setItem(hnKey, JSON.stringify(this.viewModel.hnUrls));
    } catch (error) {
      this._logger.warn('Failed to save URLs to localStorage', { error });
    }
  }

  private loadUrlsFromStorage(projectId?: string): void {
    try {
      // Load Reddit URLs
      let redditKey = projectId ? `comments-reddit-urls-${projectId}` : `comments-reddit-urls`;
      let redditStored = localStorage.getItem(redditKey);

      if (!redditStored && projectId) {
        // Fallback to global key for backward compatibility
        redditKey = `comments-reddit-urls`;
        redditStored = localStorage.getItem(redditKey);
      }

      if (redditStored) {
        const urls = JSON.parse(redditStored);
        if (Array.isArray(urls)) {
          this.viewModel.redditUrls = urls;
        }
      }

      // Load Hacker News URLs
      let hnKey = projectId ? `comments-hn-urls-${projectId}` : `comments-hn-urls`;
      let hnStored = localStorage.getItem(hnKey);

      if (!hnStored && projectId) {
        // Fallback to global key for backward compatibility
        hnKey = `comments-hn-urls`;
        hnStored = localStorage.getItem(hnKey);
      }

      if (hnStored) {
        const urls = JSON.parse(hnStored);
        if (Array.isArray(urls)) {
          this.viewModel.hnUrls = urls;
        }
      }
    } catch (error) {
      this._logger.warn('Failed to load URLs from localStorage', { error });
    }
  }
}