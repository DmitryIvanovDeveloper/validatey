import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import { ProjectNotFoundError, ProjectAccessDeniedError } from '../../../projects/domain/errors/project.error';
import { OverviewDataProviderPort } from '../ports/overview-data-provider.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type {
  GetOverviewRequest,
  GetOverviewResponse,
  ExecutiveSummary,
  PulseMetric,
  SmartAction,
  ResearchContext,
  LearningJourney,
  DecisionPathway,
  ValidationStatus,
} from './input-output/get-overview.io';
import type { OverviewRawData } from '../../application/ports/overview-data-provider.port';

const SIGNIFICANCE_TARGET = 50;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

@injectable()
export class GetOverviewUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(TYPES.OverviewDataProvider)
    private readonly _dataProvider: OverviewDataProviderPort
  ) {}

  async execute(
    request: GetOverviewRequest
  ): Promise<ResultEx<GetOverviewResponse, ProjectNotFoundError | ProjectAccessDeniedError | Error>> {
    this._logger.info('get-overview.start', { projectId: request.projectId, userId: request.userId });

    const projectResult = await this._projectRepository.findById(request.projectId);
    if (!projectResult.isSuccess) {
      return ResultEx.failure(projectResult.error);
    }
    const project = projectResult.data;
    if (project.userId !== request.userId) {
      return ResultEx.failure(new ProjectAccessDeniedError(request.projectId, request.userId));
    }

    const dataResult = await this._dataProvider.getData(request.projectId);
    if (!dataResult.isSuccess) {
      this._logger.error('get-overview.data-error', { projectId: request.projectId, error: dataResult.error });
      return ResultEx.failure(dataResult.error);
    }

    const d = dataResult.data;
    const executiveSummary = this.buildExecutiveSummary(d);
    const pulse = this.buildPulse(d, request.projectId);
    const smartActions = this.buildSmartActions(d, request.projectId);
    const researchContext = this.buildResearchContext(d);
    const learningJourney = this.buildLearningJourney(d, request.projectId);
    const decisionPathway = this.buildDecisionPathway(d);

    return ResultEx.success({
      executiveSummary,
      pulse,
      smartActions,
      researchContext,
      learningJourney,
      decisionPathway,
    });
  }

  private buildExecutiveSummary(d: OverviewRawData): ExecutiveSummary {
    const sent = d.invitations.filter(
      (i) => i.status === 'sent' || i.status === 'responded' || i.status === 'completed'
    ).length;
    const responded = d.responses.length; // Count actual responses instead of invitation statuses
    const responseRatePct = sent > 0 ? Math.round((responded / sent) * 100) : 0;
    const pace = this.computePace(d.responses);
    const validationStatus = this.inferValidationStatus(responded, responseRatePct, d.earlySignals.length);
    const neededForSignificance =
      responded < SIGNIFICANCE_TARGET ? Math.max(0, SIGNIFICANCE_TARGET - responded) : null;
    const keyInsight =
      d.earlySignals.length > 0
        ? d.earlySignals[0].description || d.earlySignals[0].title
        : d.rounds.find((r) => r.results?.keyFinding)?.results?.keyFinding ?? null;
    let daysRemaining: number | null = null;
    if (d.project.deadline) {
      const now = Date.now();
      const end = d.project.deadline.getTime();
      daysRemaining = Math.max(0, Math.ceil((end - now) / MS_PER_DAY));
    }
    const aiVerdict = this.buildAiVerdict(responded, responseRatePct, neededForSignificance, daysRemaining, pace);

    return {
      projectName: d.project.name,
      status: d.project.status,
      validationStatus,
      responded,
      sent,
      responseRatePct,
      neededForSignificance,
      keyInsight,
      deadline: d.project.deadline ? d.project.deadline.toISOString() : null,
      daysRemaining,
      paceResponsesPerDay: pace,
      aiVerdict,
      createdAt: d.project.createdAt.toISOString(),
    };
  }

  private computePace(responses: Array<{ createdAt: Date }>): number {
    if (responses.length < 2) return responses.length;
    const sorted = [...responses].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const first = sorted[0].createdAt.getTime();
    const last = sorted[sorted.length - 1].createdAt.getTime();
    const days = (last - first) / MS_PER_DAY;
    if (days <= 0) return responses.length;
    return Math.round((responses.length / days) * 10) / 10;
  }

  private inferValidationStatus(
    responded: number,
    responseRatePct: number,
    signalsCount: number
  ): ValidationStatus {
    if (responded === 0) return 'no_data';
    if (responded >= SIGNIFICANCE_TARGET && responseRatePct >= 40 && signalsCount > 0) return 'validated';
    if (responded >= 10 && signalsCount > 0) return 'unclear_signal';
    return 'weak_support';
  }

  private buildAiVerdict(
    responded: number,
    responseRatePct: number,
    needed: number | null,
    daysRemaining: number | null,
    pace: number
  ): string {
    const parts: string[] = [];
    if (responded === 0) {
      return 'Send invitations to start collecting responses and get an AI verdict.';
    }
    if (needed !== null && needed > 0) {
      parts.push(`Need ${needed} more responses for statistical significance.`);
    }
    if (responseRatePct < 20) {
      parts.push('Consider sending reminders or increasing incentive to improve response rate.');
    }
    if (daysRemaining !== null && pace > 0 && needed !== null && needed > 0) {
      const atPace = Math.ceil(needed / pace);
      if (atPace > daysRemaining) {
        parts.push(`At current pace, extend deadline or accelerate collection.`);
      }
    }
    if (parts.length === 0 && responded >= SIGNIFICANCE_TARGET) {
      return 'Hypothesis looks promising with enough data. Review Report for full insights.';
    }
    return parts.length > 0 ? parts.join(' ') : 'Keep collecting responses and check Early Signals on the Report.';
  }

  private buildPulse(d: import('../ports/overview-data-provider.port').OverviewRawData, projectId: string): PulseMetric[] {
    const sent = d.invitations.filter(
      (i) => i.status === 'sent' || i.status === 'responded' || i.status === 'completed'
    ).length;
    const responded = d.responses.length; // Count actual responses instead of invitation statuses
    const responseRatePct = sent > 0 ? Math.round((responded / sent) * 100) : 0;
    const pace = this.computePace(d.responses);
    const richness = this.computeDataRichness(d);
    const daysRemaining = d.project.deadline
      ? Math.max(0, Math.ceil((d.project.deadline.getTime() - Date.now()) / MS_PER_DAY))
      : null;

    const paceStatus: PulseMetric['status'] = pace >= 3 ? 'good' : pace >= 1 ? 'warn' : 'low';
    const richnessStatus: PulseMetric['status'] = richness >= 7 ? 'good' : richness >= 4 ? 'warn' : 'low';
    const timeStatus: PulseMetric['status'] =
      daysRemaining === null ? 'warn' : daysRemaining >= 7 ? 'good' : daysRemaining >= 1 ? 'warn' : 'low';

    return [
      {
        id: 'pace',
        label: 'Response pace',
        value: `${pace} per day`,
        detail: `${responded} responses`,
        status: paceStatus,
        actionLabel: 'Speed up',
        actionHref: `/projects/${projectId}/invitations`,
      },
      {
        id: 'richness',
        label: 'Data depth',
        value: `${richness}/10`,
        detail: responded > 0 ? 'Answer depth' : 'No data',
        status: richnessStatus,
        actionLabel: 'View report',
        actionHref: `/projects/${projectId}/report`,
      },
      {
        id: 'coverage',
        label: 'Segment coverage',
        value: sent > 0 ? `${responded}/${sent}` : '—',
        detail: 'Responses',
        status: responseRatePct >= 40 ? 'good' : responseRatePct >= 20 ? 'warn' : 'low',
        actionLabel: 'Send more',
        actionHref: `/projects/${projectId}/invitations`,
      },
      {
        id: 'time',
        label: 'Time health',
        value: daysRemaining !== null ? `${daysRemaining}d left` : 'No deadline',
        detail: daysRemaining !== null ? 'Set in project' : '—',
        status: timeStatus,
        actionLabel: 'Edit project',
        actionHref: `/projects/${projectId}`,
      },
    ];
  }

  private computeDataRichness(d: OverviewRawData): number {
    if (!d.metricsData || d.metricsData.quotes.length === 0) {
      return d.responses.length > 0 ? 5 : 0;
    }
    const totalLen = d.metricsData.quotes.reduce((sum, q) => sum + (q.text?.length ?? 0), 0);
    const avgLen = d.metricsData.quotes.length > 0 ? totalLen / d.metricsData.quotes.length : 0;
    // 0-50 chars -> 2, 50-150 -> 5, 150-300 -> 8, 300+ -> 10
    if (avgLen >= 300) return 10;
    if (avgLen >= 150) return 8;
    if (avgLen >= 50) return 5;
    return Math.max(2, Math.round(avgLen / 25));
  }

  private buildSmartActions(d: import('../ports/overview-data-provider.port').OverviewRawData, projectId: string): SmartAction[] {
    const sent = d.invitations.filter(
      (i) => i.status === 'sent' || i.status === 'responded' || i.status === 'completed'
    ).length;
    const responded = d.responses.length; // Count actual responses instead of invitation statuses
    const pending = sent - responded;
    const responseRatePct = sent > 0 ? Math.round((responded / sent) * 100) : 0;
    const actions: SmartAction[] = [];

    if (responseRatePct < 20 && pending > 0) {
      actions.push({
        id: 'reminders',
        label: 'Send reminders',
        hint: `~${pending} pending · may add responses`,
        href: `/projects/${projectId}/invitations`,
        priority: 1,
      });
    }
    actions.push({
      id: 'share',
      label: 'Share public link',
      hint: 'Copy & share',
      href: `/projects/${projectId}/invitations`,
      priority: 2,
    });
    if (responded > 0) {
      actions.push({
        id: 'report',
        label: 'View report',
        hint: 'Early signals & metrics',
        href: `/projects/${projectId}/report`,
        priority: 3,
      });
    }
    actions.push({
      id: 'research',
      label: 'Research Assistant',
      hint: 'Market & insights',
      href: `/projects/${projectId}/research`,
      priority: 4,
    });

    return actions.sort((a, b) => a.priority - b.priority).slice(0, 4);
  }

  private buildResearchContext(d: OverviewRawData): ResearchContext {
    const hasData = !!(d.researchSummary || d.researchMarketSnippet || d.researchCompetitorsSnippet);
    return {
      summary: d.researchSummary,
      marketSnippet: d.researchMarketSnippet,
      competitorsSnippet: d.researchCompetitorsSnippet,
      hasData,
    };
  }

  private buildLearningJourney(
    d: import('../ports/overview-data-provider.port').OverviewRawData,
    projectId: string
  ): LearningJourney {
    const rounds = d.rounds.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      status: r.status,
      keyFinding: r.results?.keyFinding ?? null,
      reportHref: `/projects/${projectId}/report?roundId=${r.id}`,
    }));
    const extendSuggestions = [
      'Add A/B test round to compare messaging',
      'Add interview round for depth',
      'Add pricing experiment if WTP is high',
    ];
    return { rounds, extendSuggestions };
  }

  private buildDecisionPathway(d: OverviewRawData): DecisionPathway {
    const sent = d.invitations.filter(
      (i) => i.status === 'sent' || i.status === 'responded' || i.status === 'completed'
    ).length;
    const responded = d.responses.length; // Count actual responses instead of invitation statuses
    const steps = [
      {
        id: '1',
        label: `Collect ${SIGNIFICANCE_TARGET} responses`,
        progress: `${responded}/${SIGNIFICANCE_TARGET}`,
        status: (responded >= SIGNIFICANCE_TARGET ? 'done' : responded > 0 ? 'in_progress' : 'pending') as DecisionPathway['steps'][0]['status'],
        actionHref: responded < SIGNIFICANCE_TARGET ? `/projects/${d.project.id}/invitations` : null,
      },
      {
        id: '2',
        label: 'Review Early Signals',
        progress: d.earlySignals.length > 0 ? `${d.earlySignals.length} signals` : 'None yet',
        status: (d.earlySignals.length > 0 ? 'done' : responded > 0 ? 'in_progress' : 'pending') as DecisionPathway['steps'][0]['status'],
        actionHref: `/projects/${d.project.id}/report`,
      },
      {
        id: '3',
        label: 'GO/NO-GO decision',
        progress: '—',
        status: 'pending' as DecisionPathway['steps'][0]['status'],
        actionHref: null,
      },
    ];
    const wtpMedian =
      d.metricsData?.wtpValues?.length ? this.median(d.metricsData.wtpValues) : null;
    const successCriteria = [
      {
        label: 'Response rate ≥ 40%',
        current: `${sent > 0 ? Math.round((responded / sent) * 100) : 0}%`,
        target: '40%',
        met: sent > 0 && (responded / sent) * 100 >= 40,
      },
      {
        label: 'WTP signal',
        current: wtpMedian != null ? `$${wtpMedian}/mo` : '—',
        target: 'Any',
        met: (wtpMedian ?? 0) > 0,
      },
      {
        label: `N ≥ ${SIGNIFICANCE_TARGET}`,
        current: `${responded}`,
        target: String(SIGNIFICANCE_TARGET),
        met: responded >= SIGNIFICANCE_TARGET,
      },
    ];
    return {
      steps,
      successCriteria,
      decisionDate: d.project.deadline ? d.project.deadline.toISOString() : null,
    };
  }

  private median(arr: number[]): number {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const m = Math.floor(s.length / 2);
    return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
  }
}
