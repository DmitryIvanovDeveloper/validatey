export class MetricsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetricsError';
  }
}

export class InvalidMetricsDataError extends MetricsError {
  constructor(message: string) {
    super(`Invalid metrics data: ${message}`);
    this.name = 'InvalidMetricsDataError';
  }
}

export class ClusteringError extends MetricsError {
  constructor(message: string) {
    super(`Clustering failed: ${message}`);
    this.name = 'ClusteringError';
  }
}

export class InsufficientDataError extends MetricsError {
  constructor(message: string) {
    super(`Insufficient data for metrics calculation: ${message}`);
    this.name = 'InsufficientDataError';
  }
}



