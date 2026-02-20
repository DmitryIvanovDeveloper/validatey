import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as SIGNALS_TYPES } from '../../../signals/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { EarlySignalsRepositoryPort } from '../../../signals/application/ports/early-signals-repository.port';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import type { AssumptionAssessmentLlmPort } from '../ports/assumption-assessment-llm.port';
import type { AssumptionAssessment } from '../../domain/value-objects/assumption-assessment.vo';

export interface GenerateAssumptionAssessmentsRequest {
  projectId: string;
}

@injectable()
export class GenerateAssumptionAssessmentsUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(SIGNALS_TYPES.EarlySignalsRepository)
    private readonly _signalsRepository: EarlySignalsRepositoryPort,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort,
    @inject(RESEARCH_TYPES.AssumptionAssessmentLlm)
    private readonly _assessmentLlm: AssumptionAssessmentLlmPort
  ) {}

  async execute(request: GenerateAssumptionAssessmentsRequest): Promise<ResultEx<AssumptionAssessment[] | null, Error>> {
    const { projectId } = request;
    this._logger.info('generate-assumption-assessments.start', { projectId });

    try {
      const projectResult = await this._projectRepository.findById(projectId);
      if (!projectResult.isSuccess) {
        return ResultEx.success(null);
      }
      const project = projectResult.data;

      const storedResult = await this._researchDataRepository.findByProjectId(projectId);
      const stored = storedResult.isSuccess ? storedResult.data : null;

      if (!stored?.synthesisReport?.summary) {
        this._logger.info('generate-assumption-assessments.skip-no-synthesis', { projectId });
        return ResultEx.success(null);
      }

      const assumptions = project.hypothesis?.assumptions ?? [];
      if (assumptions.length === 0) {
        return ResultEx.success(null);
      }

      const signalsResult = await this._signalsRepository.findByProjectId(projectId);
      const signals = signalsResult.isSuccess ? signalsResult.data : [];
      const earlySignalsSummary =
        signals.length > 0
          ? signals.map((s) => `[${s.type}] ${s.title}: ${s.description}`).join('. ')
          : 'No early signals yet';

      const userInsightsParts: string[] = [];
      if (stored?.userInsights?.topPains?.length) {
        userInsightsParts.push(`Pain points: ${stored.userInsights.topPains.join('; ')}`);
      }
      if (stored?.userInsights?.wtp) {
        userInsightsParts.push(`WTP: ${stored.userInsights.wtp}`);
      }
      const userInsightsSummary = userInsightsParts.length > 0 ? userInsightsParts.join('. ') : 'No user insights yet';

      const llmResult = await this._assessmentLlm.generate(
        assumptions.map((a) => ({ assumptionId: a.id, text: a.text })),
        {
          synthesisSummary: stored.synthesisReport.summary,
          verdict: String(stored.synthesisReport.verdict ?? ''),
          userInsightsSummary,
          earlySignalsSummary,
        }
      );

      if (!llmResult.isSuccess) {
        this._logger.warn('generate-assumption-assessments.llm-failed', { projectId, error: llmResult.error });
        return ResultEx.success(null);
      }

      this._logger.info('generate-assumption-assessments.success', {
        projectId,
        count: llmResult.data.length,
      });
      return ResultEx.success(llmResult.data);
    } catch (error) {
      this._logger.error('generate-assumption-assessments.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
