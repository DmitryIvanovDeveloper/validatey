import { injectable, inject } from 'inversify';
import { ReportViewModel } from '../view-models/report.view-model';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';

@injectable()
export class ReportPresenter {
  readonly labels = {
    projects: 'Projects',
    project: 'Project',
    report: 'Report',
    projectReport: 'Project Report',
    downloadHtml: 'Download HTML',
    downloadPdf: 'Download PDF',
    share: 'Share',
    back: '← Back',
    subtitle: 'Validation results and recommendations',
    generatingReport: 'Generating report...',
    notEnoughResponses: 'Not enough responses yet',
    notEnoughResponsesDesc: 'Collect more survey responses to generate your validation report. Then try again or go back to the project to track progress.',
    tryAgain: 'Try again',
    backToProject: '← Back to project',
    retry: 'Retry',
    summary: 'Summary',
    verdict: 'Verdict:',
    keyInsight: 'Key insight:',
    recommendation: 'Recommendation:',
    go: 'Go',
    noGo: 'No-go',
    neutral: 'Neutral',
    expandFullReport: 'Expand full report',
    collapseFullReport: 'Collapse full report',
  };

  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}
}

