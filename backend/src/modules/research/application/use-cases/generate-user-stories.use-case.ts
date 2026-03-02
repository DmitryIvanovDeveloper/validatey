import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { ProjectNotFoundError } from '../../../projects/domain/errors/project.error';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import type { UserStoriesLlmPort, UserStoriesInput, UserStory, UserStoriesGenerationError } from '../ports/user-stories-llm.port';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';

export interface GenerateUserStoriesRequest {
  projectId: string;
}

export interface GenerateUserStoriesResponse {
  userStories: UserStory[];
  generatedAt: Date;
}

@injectable()
export class GenerateUserStoriesUseCase {
	constructor(
		@inject(ROOT_TYPES.Logger)
		private readonly _logger: LoggerPort,
		@inject(PROJECT_TYPES.ProjectRepository)
		private readonly _projectRepository: ProjectRepositoryPort,
		@inject(TYPES.ResearchDataRepository)
		private readonly _researchRepository: ResearchDataRepositoryPort,
		@inject(TYPES.UserStoriesLlm)
		private readonly _userStoriesLlm: UserStoriesLlmPort
	) {}

  async execute(
    request: GenerateUserStoriesRequest
  ): Promise<ResultEx<GenerateUserStoriesResponse, Error>> {
    this._logger.info('generate-user-stories.start', { projectId: request.projectId });

    try {
      // 1. Load project data
      const projectResult = await this._projectRepository.findById(request.projectId);
      if (!projectResult.isSuccess) {
        this._logger.warn('generate-user-stories.project-not-found', { projectId: request.projectId });
        return ResultEx.failure(new ProjectNotFoundError(request.projectId));
      }
      const project = projectResult.data;

      // 2. Load research data
      const researchDataResult = await this._researchRepository.findByProjectId(request.projectId);
      if (!researchDataResult.isSuccess || !researchDataResult.data) {
        this._logger.warn('generate-user-stories.no-research-data', { projectId: request.projectId });
        return ResultEx.failure(new Error('Research data not found'));
      }

      const researchData = researchDataResult.data;
      if (!researchData.synthesisReport) {
        this._logger.warn('generate-user-stories.no-synthesis', { projectId: request.projectId });
        return ResultEx.failure(new Error('Synthesis report required for user stories generation'));
      }

      // 3. Prepare input for LLM
      const input: UserStoriesInput = {
        projectName: project.name,
        hypothesisSummary: this.formatHypothesis(project.hypothesis),
        marketSummary: this.formatMarketData(researchData),
        synthesisReport: {
          summary: researchData.synthesisReport.summary || '',
          verdict: researchData.synthesisReport.verdict || 'needs-more-data',
          recommendations: Array.isArray(researchData.synthesisReport.recommendations)
            ? researchData.synthesisReport.recommendations
            : []
        },
        commentPatternAnalysis: researchData.commentPatternAnalysis ? {
          patterns: researchData.commentPatternAnalysis.patterns?.slice(0, 10).map(p => ({
            type: p.type,
            label: p.label,
            insight: p.insight,
            sentimentScore: p.sentimentScore ?? 0,
            confidenceScore: p.confidenceScore ?? 0
          })) || [],
          validationScore: researchData.commentPatternAnalysis.validationScore || 0
        } : undefined,
        targetAudience: project.targetAudience || '',
        commentMetrics: researchData.commentMetrics,
        topPainPoints: researchData.userInsights?.topPains?.length
          ? researchData.userInsights.topPains.slice(0, 8)
          : undefined,
        keyAssumptions: this.buildKeyAssumptions(project.hypothesis, researchData.assumptionAssessments),
        patternExampleQuotes: this.buildPatternQuotes(researchData.commentPatternAnalysis)
      };

      // 4. Generate user stories via LLM
      const llmResult = await this._userStoriesLlm.generateUserStories(input);
      if (!llmResult.isSuccess) {
        this._logger.error('generate-user-stories.llm-failed', {
          projectId: request.projectId,
          error: llmResult.error.message
        });
        return ResultEx.failure(llmResult.error);
      }

      const userStories = llmResult.data;
      const generatedAt = new Date();

      // 5. Update research data with user stories
      await this._researchRepository.updateUserStories(request.projectId, userStories, generatedAt);

      this._logger.info('generate-user-stories.success', {
        projectId: request.projectId,
        storiesCount: userStories.length
      });

      return ResultEx.success({
        userStories,
        generatedAt
      });

    } catch (error) {
      this._logger.error('generate-user-stories.exception', {
        projectId: request.projectId,
        error: error instanceof Error ? error.message : String(error)
      });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private formatHypothesis(hypothesis: any): string {
    if (!hypothesis) return 'No hypothesis available';

    if (typeof hypothesis === 'string') return hypothesis;

    // Handle structured hypothesis
    const problem = hypothesis.problem || '';
    const solution = hypothesis.solution || '';
    const risks = Array.isArray(hypothesis.risks) ? hypothesis.risks.slice(0, 3) : [];

    let summary = '';
    if (problem) summary += `Problem: ${problem}\n`;
    if (solution) summary += `Solution: ${solution}\n`;
    if (risks.length > 0) summary += `Key Risks: ${risks.join(', ')}`;

    return summary || 'Hypothesis data incomplete';
  }

  private formatMarketData(researchData: any): string {
    const parts = [];

    if (researchData.marketData?.size) parts.push(`Market Size: ${researchData.marketData.size}`);
    if (researchData.marketData?.growth) parts.push(`Growth: ${researchData.marketData.growth}`);
    if (researchData.marketData?.trends && Array.isArray(researchData.marketData.trends)) {
      parts.push(`Trends: ${researchData.marketData.trends.slice(0, 3).join(', ')}`);
    }

    if (researchData.competitorData?.competitors) {
      parts.push(`Competitors: ${Array.isArray(researchData.competitorData.competitors)
        ? researchData.competitorData.competitors.slice(0, 3).join(', ')
        : researchData.competitorData.competitors}`);
    }

    return parts.length > 0 ? parts.join(' | ') : 'No market data available';
  }

  /** Build key assumptions with status for LLM — prefer stories for confirmed/need_more; avoid not_supported. */
  private buildKeyAssumptions(
    hypothesis: { assumptions?: Array<{ id: string; text: string }> } | null,
    assessments: Array<{ assumptionId: string; status: string; evidence?: string | null }> | null
  ): UserStoriesInput['keyAssumptions'] {
    const assumptions = hypothesis?.assumptions;
    if (!assumptions?.length) return undefined;
    const assessmentMap = new Map(
      (assessments ?? []).map(a => [a.assumptionId, { status: a.status, evidence: a.evidence ?? undefined }])
    );
    const validStatuses = ['confirmed', 'need_more', 'not_supported'];
    const out = assumptions
      .map(a => {
        const ass = assessmentMap.get(a.id);
        const status = ass && validStatuses.includes(ass.status) ? ass.status as 'confirmed' | 'need_more' | 'not_supported' : undefined;
        return { text: a.text, status: status ?? 'need_more' as const, evidence: ass?.evidence };
      })
      .filter(a => a.text.trim().length > 0);
    return out.length > 0 ? out : undefined;
  }

  /** One short quote per pattern from examples — for grounding acceptance criteria in real comments. */
  private buildPatternQuotes(commentPatternAnalysis: { patterns: ReadonlyArray<{ label: string; examples?: ReadonlyArray<{ content?: string }> }> } | null): UserStoriesInput['patternExampleQuotes'] {
    const patterns = commentPatternAnalysis?.patterns?.slice(0, 8) ?? [];
    const quotes: Array<{ patternLabel: string; quote: string }> = [];
    const maxQuoteLen = 220;
    for (const p of patterns) {
      const first = p.examples?.[0]?.content?.trim();
      if (!first) continue;
      quotes.push({ patternLabel: p.label, quote: first.length > maxQuoteLen ? first.slice(0, maxQuoteLen) + '…' : first });
    }
    return quotes.length > 0 ? quotes : undefined;
  }
}