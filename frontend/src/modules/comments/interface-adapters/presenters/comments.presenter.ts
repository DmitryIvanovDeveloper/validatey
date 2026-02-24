import { injectable, inject } from 'inversify';
import { StartFetchAndWaitUseCase } from '../../application/use-cases/start-fetch-and-wait.usecase';
import { GetFetchStatusUseCase } from '../../application/use-cases/get-fetch-status.usecase';
import { GetCommentsUseCase, CommentItem } from '../../application/use-cases/get-comments.usecase';
import { DeleteSourceUseCase } from '../../application/use-cases/delete-source.usecase';
import { COMMENT_TYPES } from '../../types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import type { FetchJobStateDTO, CommentsHttpRepositoryPort, CreateSourceInput } from '../../application/ports/comments-http-repository.port';

export interface SourceItem {
  id: string;
  url: string;
}

export interface CommentsViewModel {
  isLoading: boolean;
  isFetching: boolean;
  comments: CommentItem[];
  commentsForUrl: CommentItem[];
  fetchProgress: FetchJobStateDTO | null;
  error: string | null;
  redditUrls: string[];
  redditSources: SourceItem[];
  hnFeedType: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments';
  hnUrls: string[];
  hnSources: SourceItem[];
  linkedinUrls: string[];
  linkedinSources: SourceItem[];
}

export interface CommentsOverviewData {
  sourceStats: Array<{
    source: string;
    count: number;
  }>;
  totalComments: number;
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
    redditSources: [],
    hnFeedType: 'top',
    hnUrls: [],
    hnSources: [],
    linkedinUrls: [],
    linkedinSources: [],
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
    @inject(COMMENT_TYPES.CommentsHttpRepository)
    private readonly _httpRepository: CommentsHttpRepositoryPort,
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
        limit: 100,
      });

      if (result.isSuccess) {
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

  async loadCommentsBySourceId(projectId: string, sourceId: string): Promise<void> {
    try {
      this.viewModel.isLoading = true;
      this.viewModel.error = null;

      const result = await this._getCommentsUseCase.execute({
        projectId,
        sourceId,
        limit: 500,
      });

      if (result.isSuccess) {
        this.viewModel.commentsForUrl = result.data.comments;
      } else {
        this.viewModel.error = result.error.message;
        this._logger.error('Failed to load comments by sourceId', { projectId, sourceId, error: result.error });
      }
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to load comments by sourceId';
      this._logger.error('Exception loading comments by sourceId', { projectId, sourceId, error });
    } finally {
      this.viewModel.isLoading = false;
    }
  }

  async deleteSourceByUrl(projectId: string, url: string): Promise<void> {
    try {
      this.viewModel.error = null;

      // Get all sources for this project to find the matching sourceId
      const sourcesResult = await this._getCommentsUseCase.getCommentSources(projectId);
      if (!sourcesResult.isSuccess) {
        this.viewModel.error = 'Failed to find source to delete';
        return;
      }

      // Find source by URL
      const source = sourcesResult.data.find(s =>
        s.redditUrl === url || s.hnUrl === url || s.linkedinUrl === url
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
        }
      } else if (url.includes('ycombinator.com') || url.includes('news.ycombinator.com')) {
        const index = this.viewModel.hnUrls.indexOf(url);
        if (index !== -1) {
          this.viewModel.hnUrls.splice(index, 1);
        }
      } else if (url.includes('linkedin.com')) {
        const index = this.viewModel.linkedinUrls?.indexOf(url);
        if (index !== undefined && index !== -1) {
          this.viewModel.linkedinUrls.splice(index, 1);
        }
      }

      // Reload comments to reflect the changes
      await this.loadComments(projectId);

      this._logger.info('Successfully deleted source by URL', { projectId, url });

    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to delete source';
      this._logger.error('Exception deleting source', { projectId, url, error });
    }
  }

  /**
   * Fetch all existing sources for a project — called from "Start Research" flow.
   * No URLs needed: the backend finds sources from its own storage by projectId.
   */
  async startFetchAllProjectSources(projectId: string): Promise<void> {
    try {
      this.viewModel.isFetching = true;
      this.viewModel.error = null;
      this.viewModel.fetchProgress = null;

      const result = await this._startFetchAndWaitUseCase.execute(
        { projectId, periodDays: 30 },
        { onProgress: (progress) => { this.viewModel.fetchProgress = progress; } }
      );

      if (result.isSuccess) {
        await this.loadComments(projectId);
      } else {
        this.viewModel.error = result.error.message;
        this._logger.error('Failed to fetch comments (all sources)', { projectId, error: result.error });
      }
    } catch (error) {
      this.viewModel.error = error instanceof Error ? error.message : 'Failed to fetch comments';
      this._logger.error('Exception fetching comments (all sources)', { projectId, error });
    } finally {
      this.viewModel.isFetching = false;
      this.viewModel.fetchProgress = null;
    }
  }

  async startFetch(projectId: string): Promise<void> {
    try {
      this.viewModel.isFetching = true;
      this.viewModel.error = null;
      this.viewModel.fetchProgress = null;

      const hasReddit = this.viewModel.redditUrls.length > 0;
      const hasLinkedIn = this.viewModel.linkedinUrls && this.viewModel.linkedinUrls.length > 0;
      const sourceType: 'reddit' | 'hackernews' | 'linkedin' = hasReddit ? 'reddit' : (hasLinkedIn ? 'linkedin' : 'hackernews');
      const input = {
        projectId,
        sourceType,
        redditUrls: hasReddit ? this.viewModel.redditUrls : undefined,
        hnFeedType: !hasReddit && !hasLinkedIn && this.viewModel.hnUrls.length === 0 ? this.viewModel.hnFeedType : undefined,
        hnUrls: this.viewModel.hnUrls.length > 0 ? this.viewModel.hnUrls : undefined,
        linkedinUrls: hasLinkedIn ? this.viewModel.linkedinUrls : undefined,
        periodDays: 30,
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


  // Load sources from backend and populate URLs and source ID maps
  async loadSourcesFromBackend(projectId: string): Promise<void> {
    try {
      const sourcesResult = await this._getCommentsUseCase.getCommentSources(projectId);
      if (sourcesResult.isSuccess) {
        const redditRaw = sourcesResult.data.filter(s => s.sourceType === 'reddit' && s.redditUrl);
        const hnRaw = sourcesResult.data.filter(s => s.sourceType === 'hackernews' && s.hnUrl);
        const linkedinRaw = sourcesResult.data.filter(s => s.sourceType === 'linkedin' && s.linkedinUrl);

        this.viewModel.redditSources = redditRaw.map(s => ({ id: s.id, url: s.redditUrl! }));
        this.viewModel.redditUrls = this.viewModel.redditSources.map(s => s.url);

        this.viewModel.hnSources = hnRaw.map(s => ({ id: s.id, url: s.hnUrl! }));
        this.viewModel.hnUrls = this.viewModel.hnSources.map(s => s.url);

        this.viewModel.linkedinSources = linkedinRaw.map(s => ({ id: s.id, url: s.linkedinUrl! }));
        this.viewModel.linkedinUrls = this.viewModel.linkedinSources.map(s => s.url);

        this._logger.info('Loaded sources from backend', {
          projectId,
          redditSourcesCount: this.viewModel.redditSources.length,
          hnSourcesCount: this.viewModel.hnSources.length,
          linkedinSourcesCount: this.viewModel.linkedinSources.length,
        });
      } else {
        this._logger.error('Failed to load sources from backend', {
          projectId,
          error: sourcesResult.error,
        });
      }
    } catch (error) {
      this._logger.error('Exception loading sources from backend', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Initialize URLs from backend when presenter is created
  async initialize(projectId?: string): Promise<void> {
    if (projectId) {
      await this.loadSourcesFromBackend(projectId);
    }
  }

  // Load URLs for a specific project from backend
  async loadUrlsForProject(projectId: string): Promise<void> {
    await this.loadSourcesFromBackend(projectId);
  }

  setRedditUrl(_url: string): void {
    // Deprecated: use addRedditUrl instead
  }

  setHnFeedType(feedType: 'top' | 'new' | 'ask' | 'show' | 'jobs' | 'newcomments'): void {
    this.viewModel.hnFeedType = feedType;
  }

  async addRedditUrl(url: string, projectId: string): Promise<void> {
    if (!url.trim() || this.viewModel.redditUrls.includes(url.trim())) {
      return;
    }

    try {
      const createInput: CreateSourceInput = {
        sourceType: 'reddit',
        redditUrl: url.trim()
      };

      const createResult = await this._httpRepository.createSource(projectId, createInput);
      if (createResult.isSuccess) {
        const newUrl = url.trim();
        this.viewModel.redditUrls.push(newUrl);
        this.viewModel.redditSources.push({ id: createResult.data.id, url: newUrl });
        this._logger.info('Created Reddit source', { projectId, url: newUrl });
      } else {
        this._logger.error('Failed to create Reddit source', {
          projectId,
          url: url.trim(),
          error: createResult.error
        });
        throw createResult.error;
      }
    } catch (error) {
      this._logger.error('Exception creating Reddit source', {
        projectId,
        url: url.trim(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async removeRedditUrl(index: number, projectId: string): Promise<void> {
    const url = this.viewModel.redditUrls[index];
    if (!url) return;

    try {
      // Find source by URL and delete it
      const sourcesResult = await this._getCommentsUseCase.getCommentSources(projectId);
      if (sourcesResult.isSuccess) {
        const source = sourcesResult.data.find(s =>
          s.sourceType === 'reddit' && s.redditUrl === url
        );

        if (source) {
          const deleteResult = await this._deleteSourceUseCase.execute(projectId, source.id);
          if (deleteResult.isSuccess) {
            this.viewModel.redditUrls.splice(index, 1);
            const srcIdx = this.viewModel.redditSources.findIndex(s => s.id === source.id);
            if (srcIdx !== -1) this.viewModel.redditSources.splice(srcIdx, 1);
            this._logger.info('Deleted Reddit source', { projectId, url });
          } else {
            this._logger.error('Failed to delete Reddit source', {
              projectId,
              url,
              error: deleteResult.error
            });
            throw deleteResult.error;
          }
        } else {
          this.viewModel.redditUrls.splice(index, 1);
          this.viewModel.redditSources.splice(index, 1);
          this._logger.warn('Reddit source not found in backend, removed from UI', { projectId, url });
        }
      }
    } catch (error) {
      this._logger.error('Exception removing Reddit URL', {
        projectId,
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async updateRedditUrl(index: number, url: string, projectId: string): Promise<void> {
    const oldUrl = this.viewModel.redditUrls[index];
    if (!oldUrl || oldUrl === url.trim()) return;

    try {
      // First, remove the old source
      await this.removeRedditUrl(index, projectId);

      // Then add the new one
      await this.addRedditUrl(url, projectId);
    } catch (error) {
      // Restore the old URL on failure
      this.viewModel.redditUrls[index] = oldUrl;
      throw error;
    }
  }

  async addHnUrl(url: string, projectId: string): Promise<void> {
    if (!url.trim() || this.viewModel.hnUrls.includes(url.trim())) {
      return;
    }

    try {
      const createInput: CreateSourceInput = {
        sourceType: 'hackernews',
        hnUrl: url.trim()
      };

      const createResult = await this._httpRepository.createSource(projectId, createInput);
      if (createResult.isSuccess) {
        const newUrl = url.trim();
        this.viewModel.hnUrls.push(newUrl);
        this.viewModel.hnSources.push({ id: createResult.data.id, url: newUrl });
        this._logger.info('Created HN source', { projectId, url: newUrl });
      } else {
        this._logger.error('Failed to create HN source', {
          projectId,
          url: url.trim(),
          error: createResult.error
        });
        throw createResult.error;
      }
    } catch (error) {
      this._logger.error('Exception creating HN source', {
        projectId,
        url: url.trim(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async removeHnUrl(index: number, projectId: string): Promise<void> {
    const url = this.viewModel.hnUrls[index];
    if (!url) return;

    try {
      // Find source by URL and delete it
      const sourcesResult = await this._getCommentsUseCase.getCommentSources(projectId);
      if (sourcesResult.isSuccess) {
        const source = sourcesResult.data.find(s =>
          s.sourceType === 'hackernews' && s.hnUrl === url
        );

        if (source) {
          const deleteResult = await this._deleteSourceUseCase.execute(projectId, source.id);
          if (deleteResult.isSuccess) {
            this.viewModel.hnUrls.splice(index, 1);
            const srcIdx = this.viewModel.hnSources.findIndex(s => s.id === source.id);
            if (srcIdx !== -1) this.viewModel.hnSources.splice(srcIdx, 1);
            this._logger.info('Deleted HN source', { projectId, url });
          } else {
            this._logger.error('Failed to delete HN source', {
              projectId,
              url,
              error: deleteResult.error
            });
            throw deleteResult.error;
          }
        } else {
          this.viewModel.hnUrls.splice(index, 1);
          this.viewModel.hnSources.splice(index, 1);
          this._logger.warn('HN source not found in backend, removed from UI', { projectId, url });
        }
      }
    } catch (error) {
      this._logger.error('Exception removing HN URL', {
        projectId,
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async updateHnUrl(index: number, url: string, projectId: string): Promise<void> {
    const oldUrl = this.viewModel.hnUrls[index];
    if (!oldUrl || oldUrl === url.trim()) return;

    try {
      // First, remove the old source
      await this.removeHnUrl(index, projectId);

      // Then add the new one
      await this.addHnUrl(url, projectId);
    } catch (error) {
      // Restore the old URL on failure
      this.viewModel.hnUrls[index] = oldUrl;
      throw error;
    }
  }

  async addLinkedInUrl(url: string, projectId: string): Promise<void> {
    if (!url.trim() || (this.viewModel.linkedinUrls && this.viewModel.linkedinUrls.includes(url.trim()))) {
      return;
    }

    try {
      const createInput: CreateSourceInput = {
        sourceType: 'linkedin',
        linkedinUrl: url.trim()
      };

      const createResult = await this._httpRepository.createSource(projectId, createInput);
      if (createResult.isSuccess) {
        const newUrl = url.trim();
        if (!this.viewModel.linkedinUrls) {
          this.viewModel.linkedinUrls = [];
        }
        if (!this.viewModel.linkedinSources) {
          this.viewModel.linkedinSources = [];
        }
        this.viewModel.linkedinUrls.push(newUrl);
        this.viewModel.linkedinSources.push({ id: createResult.data.id, url: newUrl });
        this._logger.info('Created LinkedIn source', { projectId, url: newUrl });
      } else {
        this._logger.error('Failed to create LinkedIn source', {
          projectId,
          url: url.trim(),
          error: createResult.error
        });
        throw createResult.error;
      }
    } catch (error) {
      this._logger.error('Exception creating LinkedIn source', {
        projectId,
        url: url.trim(),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async removeLinkedInUrl(index: number, projectId: string): Promise<void> {
    if (!this.viewModel.linkedinUrls || !this.viewModel.linkedinSources) {
      return;
    }
    const url = this.viewModel.linkedinUrls[index];
    if (!url) return;

    try {
      // Find source by URL and delete it
      const sourcesResult = await this._getCommentsUseCase.getCommentSources(projectId);
      if (sourcesResult.isSuccess) {
        const source = sourcesResult.data.find(s =>
          s.sourceType === 'linkedin' && s.linkedinUrl === url
        );

        if (source) {
          const deleteResult = await this._deleteSourceUseCase.execute(projectId, source.id);
          if (deleteResult.isSuccess) {
            this.viewModel.linkedinUrls.splice(index, 1);
            const srcIdx = this.viewModel.linkedinSources.findIndex(s => s.id === source.id);
            if (srcIdx !== -1) this.viewModel.linkedinSources.splice(srcIdx, 1);
            this._logger.info('Deleted LinkedIn source', { projectId, url });
          } else {
            this._logger.error('Failed to delete LinkedIn source', {
              projectId,
              url,
              error: deleteResult.error
            });
            throw deleteResult.error;
          }
        } else {
          this.viewModel.linkedinUrls.splice(index, 1);
          this.viewModel.linkedinSources.splice(index, 1);
          this._logger.warn('LinkedIn source not found in backend, removed from UI', { projectId, url });
        }
      }
    } catch (error) {
      this._logger.error('Exception removing LinkedIn URL', {
        projectId,
        url,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async updateLinkedInUrl(index: number, url: string, projectId: string): Promise<void> {
    if (!this.viewModel.linkedinUrls) {
      return;
    }
    const oldUrl = this.viewModel.linkedinUrls[index];
    if (!oldUrl || oldUrl === url.trim()) return;

    try {
      // First, remove the old source
      await this.removeLinkedInUrl(index, projectId);

      // Then add the new one
      await this.addLinkedInUrl(url, projectId);
    } catch (error) {
      // Restore the old URL on failure
      if (this.viewModel.linkedinUrls) {
        this.viewModel.linkedinUrls[index] = oldUrl;
      }
      throw error;
    }
  }

  async getCommentsOverview(projectId: string): Promise<{
    data: CommentsOverviewData;
    error?: string;
  }> {
    try {
      const result = await this._getCommentsUseCase.execute({
        projectId,
        limit: 1000 // Get enough comments for overview
      });

      if (!result.isSuccess) {
        return { data: { sourceStats: [], totalComments: 0 }, error: result.error.message };
      }

      const comments = result.data.comments;

      // Debug logging
      console.log('[CommentsPresenter] Received comments:', comments.map(c => ({
        id: c.id,
        sourceType: c.sourceType,
        url: c.url,
        contextUrl: c.contextUrl
      })));

      // Aggregate comments by source type
      const sourceStats = comments.reduce((acc, comment) => {
        const source = comment.sourceType;
        if (source) { // Include all valid source types, including 'unknown'
          acc[source] = (acc[source] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Convert to array format expected by widget
      const sourceStatsArray = Object.entries(sourceStats).map(([source, count]) => ({
        source: source as string,
        count
      })).sort((a, b) => b.count - a.count); // Sort by count descending

      return {
        data: {
          sourceStats: sourceStatsArray,
          totalComments: comments.length
        }
      };
    } catch (error) {
      this._logger.error('Exception getting comments overview', { projectId, error });
      return {
        data: { sourceStats: [], totalComments: 0 },
        error: error instanceof Error ? error.message : 'Failed to load comments overview',
      };
    }
  }
}