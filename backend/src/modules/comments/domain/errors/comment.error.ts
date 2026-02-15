export class CommentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CommentError';
  }
}

export class CommentFetchError extends CommentError {
  constructor(message: string) {
    super(message);
    this.name = 'CommentFetchError';
  }
}

export class CommentValidationError extends CommentError {
  constructor(message: string) {
    super(message);
    this.name = 'CommentValidationError';
  }
}

export class CommentSourceError extends CommentError {
  constructor(message: string) {
    super(message);
    this.name = 'CommentSourceError';
  }
}

export class RedditApiError extends CommentFetchError {
  constructor(message: string, public readonly statusCode?: number) {
    super(`Reddit API error: ${message}`);
    this.name = 'RedditApiError';
  }
}

export class HackerNewsApiError extends CommentFetchError {
  constructor(message: string, public readonly statusCode?: number) {
    super(`Hacker News API error: ${message}`);
    this.name = 'HackerNewsApiError';
  }
}

export class CommentNotFoundError extends CommentError {
  constructor(commentId: string) {
    super(`Comment with ID ${commentId} not found`);
    this.name = 'CommentNotFoundError';
  }
}

export class CommentSourceNotFoundError extends CommentError {
  constructor(sourceId: string) {
    super(`Comment source with ID ${sourceId} not found`);
    this.name = 'CommentSourceNotFoundError';
  }
}