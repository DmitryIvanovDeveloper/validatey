import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import { MetricsData } from '../../../metrics/application/ports/metrics-repository.port';

@injectable()
export class HTMLReportGeneratorService {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async generateHTML(projectId: string, metrics: MetricsData): Promise<string> {
    this._logger.info('html-report-generator.generate.start', { projectId });

    // Simple HTML template - in production, use a proper templating engine
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Validatey Report - Project ${projectId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .metric { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
    .metric h2 { margin-top: 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #4CAF50; color: white; }
  </style>
</head>
<body>
  <h1>Validatey Research Report</h1>
  <p>Project ID: ${projectId}</p>
  <p>Generated: ${new Date().toLocaleString()}</p>

  <div class="metric">
    <h2>Problem Severity</h2>
    <p>Average Score: ${this.calculateAverage(metrics.problemSeverityScores).toFixed(2)}</p>
    <p>High Scores (≥4): ${metrics.problemSeverityScores.filter((s) => s >= 4).length}</p>
  </div>

  <div class="metric">
    <h2>Willingness To Pay (WTP)</h2>
    <p>Median: $${this.calculateMedian(metrics.wtpValues).toFixed(2)}</p>
    <p>Mean: $${this.calculateMean(metrics.wtpValues).toFixed(2)}</p>
  </div>

  <div class="metric">
    <h2>Quotes & Feedback</h2>
    <p>Total Quotes: ${metrics.quotes.length}</p>
    ${metrics.quotes.length > 0 ? '<ul>' + metrics.quotes.slice(0, 10).map((q) => `<li>${q.text.substring(0, 100)}...</li>`).join('') + '</ul>' : '<p>No quotes available</p>'}
  </div>
</body>
</html>
    `.trim();

    this._logger.info('html-report-generator.generate.success', { projectId });
    return html;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  }

  private calculateMean(values: number[]): number {
    return this.calculateAverage(values);
  }
}



