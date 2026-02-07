import { injectable, inject } from 'inversify';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as INVITATION_TYPES } from '../../../invitations/infrastructure/bootstrap/types';
import { TYPES as SIGNALS_TYPES } from '../../../signals/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';
import { TYPES as ROUNDS_TYPES } from '../../../rounds/infrastructure/bootstrap/types';
import { TYPES as RESPONSES_TYPES } from '../../../responses/infrastructure/bootstrap/types';
import { TYPES as METRICS_TYPES } from '../../../metrics/infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { InvitationRepositoryPort } from '../../../invitations/application/ports/invitation-repository.port';
import type { EarlySignalsRepositoryPort } from '../../../signals/application/ports/early-signals-repository.port';
import type { ResearchDataRepositoryPort } from '../../../research/application/ports/research-data-repository.port';
import type { RoundRepositoryPort } from '../../../rounds/application/ports/round-repository.port';
import type { ResponseRepositoryPort } from '../../../responses/application/ports/response-repository.port';
import type { MetricsRepositoryPort } from '../../../metrics/application/ports/metrics-repository.port';
import type { OverviewRawData } from '../../application/ports/overview-data-provider.port';
import type { OverviewDataProviderPort } from '../../application/ports/overview-data-provider.port';

@injectable()
export class OverviewDataProviderAdapter implements OverviewDataProviderPort {
  constructor(
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(INVITATION_TYPES.InvitationRepository)
    private readonly _invitationRepository: InvitationRepositoryPort,
    @inject(SIGNALS_TYPES.EarlySignalsRepository)
    private readonly _signalsRepository: EarlySignalsRepositoryPort,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchRepository: ResearchDataRepositoryPort,
    @inject(ROUNDS_TYPES.RoundRepository)
    private readonly _roundRepository: RoundRepositoryPort,
    @inject(RESPONSES_TYPES.ResponseRepository)
    private readonly _responseRepository: ResponseRepositoryPort,
    @inject(METRICS_TYPES.MetricsRepository)
    private readonly _metricsRepository: MetricsRepositoryPort
  ) {}

  async getData(projectId: string): Promise<ResultEx<OverviewRawData, Error>> {
    try {
      const [projectResult, invitationsResult, signalsResult, researchResult, roundsResult, responsesResult, metricsResult] =
        await Promise.all([
          this._projectRepository.findById(projectId),
          this._invitationRepository.findByProjectId(projectId),
          this._signalsRepository.findByProjectId(projectId),
          this._researchRepository.findByProjectId(projectId),
          this._roundRepository.findByProjectId(projectId),
          this._responseRepository.findByProjectId(projectId),
          this._metricsRepository.getMetricsData(projectId),
        ]);

      if (!projectResult.isSuccess) {
        return ResultEx.failure(projectResult.error);
      }

      const project = projectResult.data;
      const invitations = invitationsResult.isSuccess ? invitationsResult.data : [];
      const signals = signalsResult.isSuccess ? signalsResult.data : [];
      const stored = researchResult.isSuccess ? researchResult.data : null;
      const rounds = roundsResult.isSuccess ? roundsResult.data : [];
      const responses = responsesResult.isSuccess ? responsesResult.data : [];
      const metricsData = metricsResult.isSuccess ? metricsResult.data : null;

      const researchSummary = stored?.synthesisReport?.summary ?? null;
      const marketSnippet =
        stored?.marketData && (stored.marketData.size || stored.marketData.growth)
          ? [stored.marketData.size, stored.marketData.growth].filter(Boolean).join(', ')
          : null;
      const competitorsSnippet =
        stored?.competitorData && (stored.competitorData.priceRange || (stored.competitorData.competitors?.length ?? 0) > 0)
          ? [stored.competitorData.priceRange, (stored.competitorData.competitors ?? []).slice(0, 3).join(', ')].filter(Boolean).join(' · ')
          : null;

      const raw: OverviewRawData = {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          deadline: project.deadline ?? null,
          createdAt: project.createdAt,
          segment: project.segment,
          hypothesis: project.hypothesis,
          scenarioTemplateSlug: project.scenarioTemplateSlug,
        },
        invitations: invitations.map((i) => ({ status: i.status })),
        earlySignals: signals.map((s) => ({
          type: s.type,
          title: s.title,
          description: s.description,
        })),
        researchSummary,
        researchMarketSnippet: marketSnippet,
        researchCompetitorsSnippet: competitorsSnippet,
        rounds: rounds.map((r) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          status: r.status,
          results: r.results ?? null,
        })),
        responses: responses.map((r) => ({
          createdAt: r.createdAt,
          answers: r.answers ?? {},
        })),
        metricsData: metricsData
          ? {
              quotes: metricsData.quotes.map((q) => ({ text: q.text })),
              wtpValues: metricsData.wtpValues,
              problemSeverityScores: metricsData.problemSeverityScores,
            }
          : null,
      };

      return ResultEx.success(raw);
    } catch (error) {
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
