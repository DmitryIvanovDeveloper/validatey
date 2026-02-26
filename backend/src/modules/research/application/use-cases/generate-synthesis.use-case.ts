import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES as PROJECT_TYPES } from '../../../projects/infrastructure/bootstrap/types';
import { TYPES as SIGNALS_TYPES } from '../../../signals/infrastructure/bootstrap/types';
import { TYPES as METRICS_TYPES } from '../../../metrics/infrastructure/bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../infrastructure/bootstrap/types';
import { TYPES as RESPONSES_TYPES } from '../../../responses/infrastructure/bootstrap/types';
import { COMMENT_TYPES } from '../../../comments/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { EarlySignalsRepositoryPort } from '../../../signals/application/ports/early-signals-repository.port';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import type { SynthesisLlmPort } from '../ports/synthesis-llm.port';
import { GenerateAssumptionAssessmentsUseCase } from './generate-assumption-assessments.use-case';
import type { ResponseRepositoryPort } from '../../../responses/application/ports/response-repository.port';
import type { CommentRepositoryPort } from '../../../comments/application/ports/comment-repository.port';
import { CalculateMetricsUseCase } from '../../../metrics/application/use-cases/calculate-metrics.use-case';
import { ResearchNotFoundError } from '../../domain/errors/research.error';
import type { SynthesisReport } from '../../domain/value-objects/synthesis-report.vo';
import type { StoredResearchData } from '../../domain/value-objects/stored-research-data.vo';
import type {
  GenerateSynthesisRequest,
  GenerateSynthesisResponse,
} from './input-output/generate-synthesis.io';
import type { Response } from '../../../responses/domain/entities/response.entity';
import { CommentEntity } from '../../../comments/domain/entities/comment.entity';
import type { CommentPatternAnalysis } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';
import type { AcademicPapersBlock } from '../../domain/value-objects/academic-papers-block.vo';
import type { ProductHuntBlock, ProductHuntPost } from '../../domain/value-objects/product-hunt-block.vo';
import type { CommentMetrics } from '../ports/synthesis-llm.port';

@injectable()
export class GenerateSynthesisUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(PROJECT_TYPES.ProjectRepository)
    private readonly _projectRepository: ProjectRepositoryPort,
    @inject(SIGNALS_TYPES.EarlySignalsRepository)
    private readonly _signalsRepository: EarlySignalsRepositoryPort,
    @inject(RESPONSES_TYPES.ResponseRepository)
    private readonly _responseRepository: ResponseRepositoryPort,
    @inject(COMMENT_TYPES.CommentRepository)
    private readonly _commentRepository: CommentRepositoryPort,
    @inject(METRICS_TYPES.CalculateMetricsUseCase)
    private readonly _calculateMetricsUseCase: CalculateMetricsUseCase,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchDataRepository: ResearchDataRepositoryPort,
    @inject(RESEARCH_TYPES.SynthesisLlm)
    private readonly _synthesisLlm: SynthesisLlmPort,
    @inject(RESEARCH_TYPES.GenerateAssumptionAssessmentsUseCase)
    private readonly _generateAssumptionAssessmentsUseCase: GenerateAssumptionAssessmentsUseCase
  ) {}

  async execute(
    request: GenerateSynthesisRequest
  ): Promise<ResultEx<GenerateSynthesisResponse, ResearchNotFoundError | Error>> {
    const { projectId } = request;
    this._logger.info('generate-synthesis.start', { projectId });

    const statusSet = await this._researchDataRepository.updateResearchStatus(projectId, 'synthesizing');
    if (!statusSet.isSuccess) {
      this._logger.warn('generate-synthesis.status-set-failed', { projectId, error: statusSet.error });
    }

    try {
      const projectResult = await this._projectRepository.findById(projectId);
      if (!projectResult.isSuccess) {
        return ResultEx.failure(new ResearchNotFoundError(projectId));
      }
      const project = projectResult.data;

      const [storedResult, signalsResult] = await Promise.all([
        this._researchDataRepository.findByProjectId(projectId),
        this._signalsRepository.findByProjectId(projectId),
      ]);
      const stored = storedResult.isSuccess ? storedResult.data : null;
      const signals = signalsResult.isSuccess ? signalsResult.data : [];

      const hypothesisSummary = project.hypothesis?.description ?? project.name ?? 'No hypothesis';
      const marketSummary = this.summarizeMarket(project.marketContext, stored?.marketData ?? null);
      const competitorSummary = this.summarizeCompetitors(stored?.competitorData ?? null);
      const autocompleteSummary = this.summarizeAutocomplete(stored?.autocompleteInsights ?? null);

      // Get user insights from responses
      const responsesResult = await this._responseRepository.findByProjectId(projectId);
      const responses = responsesResult.isSuccess ? responsesResult.data : [];
      const userInsightsSummary = this.summarizeUserInsights(responses);

      // Load all comments for synthesis (explicit limit so we never hit PostgREST default cap)
      const RESEARCH_COMMENTS_LIMIT = 10_000;
      const commentsResult = await this._commentRepository.findByProjectId(projectId, {
        limit: RESEARCH_COMMENTS_LIMIT,
      });
      const comments = commentsResult.isSuccess ? commentsResult.data : [];
      const commentsSummary = this.summarizeComments(comments);

      // Get comment pattern analysis from stored research data (used as fallback context only)
      const commentPatternAnalysis = stored?.commentPatternAnalysis ?? null;

      // Pain points are extracted AFTER synthesis so we can use the freshly generated CPA.
      // Pre-extract from responses now; comments will be re-extracted post-synthesis.
      const painPointsFromResponses = this.extractPainPointsFromResponses(responses);

      const earlySignalsSummary =
        signals.length > 0
        ? signals.map((s) => `[${s.type}] ${s.title}: ${s.description}`).join('. ')
        : 'No early signals yet';

      const academicPapersSummary = this.summarizeAcademicPapers(stored?.academicPapers ?? null);
      const productHuntSummary = this.summarizeProductHunt(stored?.productHunt ?? null);

      // Build hard factual comment metrics to ground LLM verdict decision
      const commentMetrics = this.buildCommentMetrics(comments);

      const llmResult = await this._synthesisLlm.generateSynthesis({
        projectName: project.name,
        hypothesisSummary,
        marketSummary,
        competitorSummary,
        autocompleteSummary,
        userInsightsSummary,
        commentsSummary,
        earlySignalsSummary,
        academicPapersSummary: academicPapersSummary || undefined,
        productHuntSummary: productHuntSummary || undefined,
        commentMetrics,
      });

      if (!llmResult.isSuccess) {
        return ResultEx.failure(llmResult.error);
      }

      const report: SynthesisReport = llmResult.data;

      // Use comment pattern analysis from synthesis report, or fall back to stored
      const synthesisPatternAnalysis = report.commentPatternAnalysis ?? commentPatternAnalysis;

      // Adjust verdict based on comment pattern validation score (Domain логика)
      const adjustedReport = this.adjustVerdictByCommentPatterns(report, synthesisPatternAnalysis, comments.length);

      // Now extract pain points using the FRESH CPA (synthesisPatternAnalysis) so even the first
      // run gets meaningful pain points rather than falling back to keyword-matched raw quotes.
      const painPointsFromComments = this.extractPainPointsFromComments(comments, synthesisPatternAnalysis);
      const allPainPoints = [...new Set([...painPointsFromResponses, ...painPointsFromComments])].slice(0, 5);

      // Build user insights with pain points from both responses and comments
      const userInsights = {
        topPains: allPainPoints.length > 0 ? allPainPoints : stored?.userInsights?.topPains ?? undefined,
        wtp: stored?.userInsights?.wtp,
        retentionHint: stored?.userInsights?.retentionHint,
      };

      const now = new Date();
      const updatedStored: StoredResearchData = {
        projectId,
        marketData: stored?.marketData ?? null,
        competitorData: stored?.competitorData ?? null,
        userInsights: userInsights.topPains || userInsights.wtp || userInsights.retentionHint ? userInsights : null,
        autocompleteInsights: stored?.autocompleteInsights ?? null,
        synthesisReport: adjustedReport, // Use adjusted report
        assumptionAssessments: stored?.assumptionAssessments ?? null,
        commentPatternAnalysis: synthesisPatternAnalysis, // Use analysis from synthesis
        academicPapers: stored?.academicPapers ?? null,
        productHunt: stored?.productHunt ?? null,
        lastResearchRunAt: stored?.lastResearchRunAt ?? null,
        updatedAt: now,
        researchStatus: 'idle',
        researchStatusUpdatedAt: now,
      };
      await this._researchDataRepository.save(updatedStored);

      const assessmentsResult = await this._generateAssumptionAssessmentsUseCase.execute({ projectId });
      if (assessmentsResult.isSuccess && assessmentsResult.data?.length) {
        const withAssessments: StoredResearchData = {
          ...updatedStored,
          assumptionAssessments: assessmentsResult.data,
          commentPatternAnalysis: synthesisPatternAnalysis, // Keep the freshly generated analysis
          updatedAt: new Date(),
        };
        await this._researchDataRepository.save(withAssessments);
      }

      return ResultEx.success({ report });
    } catch (error) {
      this._logger.error('generate-synthesis.exception', { projectId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      await this._researchDataRepository.updateResearchStatus(projectId, 'idle');
    }
  }

  private summarizeUserInsights(responses: Response[]): string {
    if (!responses || responses.length === 0) {
      return 'No user insights available yet';
    }

    // Extract both text and numeric answers
    const surveyResponses: Array<{ theme: string; quote: string; value?: number }> = [];
    const numericAnswers: Array<{ theme: string; value: number; questionId: string }> = [];

    for (const response of responses) {
      for (const [questionId, answer] of Object.entries(response.answers)) {
        const questionLabel = response.questionLabels[questionId] || questionId;

        if (typeof answer === 'string' && answer.trim().length > 0) {
          // Text answers - always add to surveyResponses
          surveyResponses.push({
            theme: questionLabel.toLowerCase(),
            quote: answer.trim()
          });

          // Try to extract numbers from text answers
          const numMatch = answer.match(/(\d+(\.\d+)?)/);
          if (numMatch) {
            const numValue = parseFloat(numMatch[1]);
            if (!isNaN(numValue) && numValue > 0) {
              numericAnswers.push({
                theme: questionLabel.toLowerCase(),
                value: numValue,
                questionId
              });
            }
          }
        } else if (typeof answer === 'number') {
          // Pure numeric answers
          numericAnswers.push({
            theme: questionLabel.toLowerCase(),
            value: answer,
            questionId
          });
        }
      }
    }

    if (surveyResponses.length === 0 && numericAnswers.length === 0) {
      return 'Limited user insights available';
    }

    const parts: string[] = [];

    // Analyze numeric answers (severity scores, pricing, etc.)
    if (numericAnswers.length > 0) {
      // Group numeric answers by question type
      const severityScores = numericAnswers.filter(n =>
        n.questionId === 'q_2' || // Standard severity question
        n.theme.includes('severity') || n.theme.includes('problem') ||
        n.theme.includes('pain') || n.theme.includes('annoying')
      );

      const pricingAnswers = numericAnswers.filter(n =>
        n.questionId === 'q_5' || // Common pricing question
        n.theme.includes('price') || n.theme.includes('pay') ||
        n.theme.includes('cost') || n.theme.includes('willing') ||
        n.value <= 300 // Reasonable price range for SaaS
      );

      // Calculate severity statistics
      if (severityScores.length > 0) {
        const values = severityScores.map(s => s.value);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);

        parts.push(`Problem severity: average ${average.toFixed(1)}/10 (range: ${min}-${max})`);
      }

      // Analyze pricing
      if (pricingAnswers.length > 0) {
        const values = pricingAnswers.map(p => p.value);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;

        parts.push(`Average willingness to pay: $${average.toFixed(0)}/month`);
      }
    }

    // Analyze text responses
    if (surveyResponses.length > 0) {
      // Группировка по типам вопросов для лучшего анализа
      const pricingInsights = surveyResponses.filter(r =>
        (r.theme?.includes('pay') ?? false) || (r.theme?.includes('price') ?? false) ||
        (r.theme?.includes('cost') ?? false) || r.quote.includes('$')
      );
      const painInsights = surveyResponses.filter(r =>
        (r.theme?.includes('annoying') ?? false) || (r.theme?.includes('problem') ?? false) ||
        (r.theme?.includes('pain') ?? false) || r.quote.includes('frustrat')
      );
      const toolInsights = surveyResponses.filter(r =>
        (r.theme?.includes('tools') ?? false) || r.quote.includes('tool')
      );
      const timeInsights = surveyResponses.filter(r =>
        (r.theme?.includes('hours') ?? false) || (r.theme?.includes('time') ?? false) ||
        r.quote.includes('hour') || r.quote.includes('day')
      );

      // Add pricing insights
      if (pricingInsights.length > 0) {
        const pricingQuotes = pricingInsights.slice(0, 2).map(r =>
          `"${r.quote.substring(0, 80)}${r.quote.length > 80 ? '...' : ''}"`
        );
        parts.push(`Pricing insights: ${pricingQuotes.join('; ')}`);
      }

      // Add pain points
      if (painInsights.length > 0) {
        const painQuotes = painInsights.slice(0, 2).map(r =>
          `"${r.quote.substring(0, 80)}${r.quote.length > 80 ? '...' : ''}"`
        );
        parts.push(`Key pain points: ${painQuotes.join('; ')}`);
      }

      // Add tool insights
      if (toolInsights.length > 0) {
        const toolQuotes = toolInsights.slice(0, 2).map(r =>
          `"${r.quote.substring(0, 80)}${r.quote.length > 80 ? '...' : ''}"`
        );
        parts.push(`Current tools: ${toolQuotes.join('; ')}`);
      }

      // Add time insights
      if (timeInsights.length > 0) {
        const timeQuotes = timeInsights.slice(0, 2).map(r =>
          `"${r.quote.substring(0, 80)}${r.quote.length > 80 ? '...' : ''}"`
        );
        parts.push(`Time-related insights: ${timeQuotes.join('; ')}`);
      }
    }

    // Add response count
    parts.push(`${responses.length} survey responses analyzed`);

    return parts.join('. ');
  }

  private summarizeComments(comments: CommentEntity[]): string {
    if (!comments || comments.length === 0) {
      return 'No comments collected yet';
    }

    // Группировка по источникам и анализ тем
    const sourceGroups: Record<string, CommentEntity[]> = {};
    for (const comment of comments) {
      const source = comment.subsourceName || 'other';
      if (!sourceGroups[source]) {
        sourceGroups[source] = [];
      }
      sourceGroups[source].push(comment);
    }

    const parts: string[] = [];
    for (const [source, sourceComments] of Object.entries(sourceGroups)) {
      const recentComments = sourceComments
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 3);

      const commentSummaries = recentComments.map(c =>
        `"${c.content.substring(0, 100)}${c.content.length > 100 ? '...' : ''}"`
      );

      parts.push(`${source}: ${commentSummaries.join('; ')}`);
    }

    return parts.length > 0 ? parts.join('. ') : 'Comments collected but no clear themes identified';
  }

  /**
   * Extract pain points from survey responses.
   * Looks for responses with themes related to pain, problems, annoyances, or frustration.
   */
  private extractPainPointsFromResponses(responses: Response[]): string[] {
    if (!responses || responses.length === 0) {
      return [];
    }

    const painPoints: string[] = [];
    const painKeywords = ['pain', 'problem', 'annoying', 'frustrat', 'difficult', 'issue', 'challenge', 'struggle', 'hate', 'bad'];

    for (const response of responses) {
      for (const [questionId, answer] of Object.entries(response.answers)) {
        if (typeof answer === 'string' && answer.trim().length > 0) {
          const answerLower = answer.toLowerCase();
          const hasPainKeyword = painKeywords.some(keyword => answerLower.includes(keyword));
          
          if (hasPainKeyword) {
            // Extract a concise pain point (first 150 chars)
            const painPoint = answer.trim().substring(0, 150);
            if (painPoint && !painPoints.includes(painPoint)) {
              painPoints.push(painPoint);
            }
          }
        }
      }
    }

    return painPoints;
  }

  /**
   * Extract pain points from comments.
   * Uses pattern analysis if available, otherwise falls back to keyword matching.
   */
  private extractPainPointsFromComments(
    comments: CommentEntity[],
    patternAnalysis: CommentPatternAnalysis | null
  ): string[] {
    if (!comments || comments.length === 0) {
      return [];
    }

    const extractedPains: string[] = [];

    // PRIORITY: Use pattern analysis — prefer "failure" then "myth" then negative "validation" patterns.
    // Use pattern.insight (LLM-synthesized text) as the pain point label — more meaningful than raw quotes.
    if (patternAnalysis) {
      const allPatterns = patternAnalysis.patterns;

      // Score: failure > myth > negative validation; tiebreak by confidenceScore
      const scored = allPatterns
        .map(p => {
          let typeScore = 0;
          if (p.type === 'failure') typeScore = 3;
          else if (p.type === 'myth') typeScore = 2;
          else if (p.type === 'validation' && p.sentimentScore < -0.1) typeScore = 1;
          return { pattern: p, score: typeScore * (p.confidenceScore ?? 1) };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score);

      for (const { pattern } of scored.slice(0, 5)) {
        // Use insight (LLM-synthesized summary) as the pain point text
        if (pattern.insight && pattern.insight.length > 20 && pattern.insight.length < 300) {
          extractedPains.push(pattern.insight);
        }
      }
    }

    // FALLBACK: Use keyword matching if no pattern analysis or not enough pain points found
    if (extractedPains.length === 0) {
      const painKeywords = ['pain', 'problem', 'annoying', 'frustrat', 'difficult', 'issue', 'challenge', 'struggle', 'hate', 'bad', 'sucks', 'terrible', 'awful', 'worst'];

      for (const comment of comments) {
        if (!comment.content || comment.content.trim().length === 0) {
          continue;
        }

        const contentLower = comment.content.toLowerCase();
        const hasPainKeyword = painKeywords.some(keyword => contentLower.includes(keyword));
        
        if (hasPainKeyword) {
          // Extract a concise pain point (first 150 chars)
          const painPoint = comment.content.trim().substring(0, 150);
          if (painPoint && !extractedPains.includes(painPoint)) {
            extractedPains.push(painPoint);
          }
        }
      }
    }

    return extractedPains.slice(0, 5); // Limit to 5
  }

  /**
   * Summarize comment pattern analysis for LLM context.
   * Converts CommentPatternAnalysis into a text summary.
   */
  private summarizeCommentPatternAnalysis(
    analysis: CommentPatternAnalysis | null
  ): string | undefined {
    if (!analysis || analysis.patterns.length === 0) {
      return undefined; // Optional field - не передаем, если нет данных
    }

    const parts: string[] = [];
    parts.push(`Comment validation score: ${analysis.validationScore}/100 (${analysis.totalComments} comments analyzed)`);

    // Group patterns by type for better context
    const byType: Record<string, Array<typeof analysis.patterns[number]>> = {};
    for (const pattern of analysis.patterns) {
      if (!byType[pattern.type]) {
        byType[pattern.type] = [];
      }
      byType[pattern.type].push(pattern);
    }

    // Add key insights from top patterns
    for (const [type, patterns] of Object.entries(byType)) {
      const topPattern = patterns[0]; // Most common pattern of this type
      parts.push(
        `${type}: ${topPattern.label} (${topPattern.count} comments, ${topPattern.percentage}%) - ${topPattern.insight}`
      );
    }

    return parts.join('. ');
  }

  /**
   * Protective guard only: downgrade `validated` when there is overwhelming negative signal.
   * Auto-upgrade is intentionally removed — the LLM now receives hard metrics and decides itself.
   */
  private adjustVerdictByCommentPatterns(
    report: SynthesisReport,
    patternAnalysis: CommentPatternAnalysis | null,
    commentCount: number
  ): SynthesisReport {
    if (!patternAnalysis) return report;

    const { validationScore } = patternAnalysis;
    const sentimentOverall: number = patternAnalysis.sentimentOverview?.overall ?? 0;

    // Protective downgrade: strong negative community signal overrides optimistic LLM verdict
    if (validationScore < 30 && sentimentOverall < -0.3 && commentCount >= 30) {
      if (report.verdict === 'validated') {
        return {
          ...report,
          verdict: 'needs-more-data' as const,
          summary: `${report.summary} Warning: negative community signals detected (validation score: ${validationScore}/100, sentiment: ${sentimentOverall.toFixed(1)}).`,
        };
      }
    }

    return report;
  }

  private buildCommentMetrics(comments: readonly CommentEntity[]): CommentMetrics {
    const bySource: Record<string, number> = {};
    for (const c of comments) {
      const src = c.sourceId;
      bySource[src] = (bySource[src] ?? 0) + 1;
    }
    // Replace UUID keys with ordinal labels for readability in LLM prompt
    const labeled: Record<string, number> = {};
    let idx = 1;
    for (const [, cnt] of Object.entries(bySource)) {
      labeled[`source_${idx++}`] = cnt;
    }
    return { totalCount: comments.length, bySource: labeled };
  }

  private summarizeMarket(
    marketContext: { marketPicture?: string; marketFit?: string; differentiation?: string } | null,
    marketData: StoredResearchData['marketData']
  ): string {
    if (marketData?.size || marketData?.growth || (marketData?.trends && marketData.trends.length > 0)) {
      return [marketData.size, marketData.growth, marketData.trends?.join(', ')].filter(Boolean).join('. ');
    }
    const parts = [marketContext?.marketPicture, marketContext?.marketFit, marketContext?.differentiation].filter(
      Boolean
    );
    return parts.length > 0 ? parts.join('. ') : 'No market data';
  }

  private summarizeAutocomplete(autocomplete: StoredResearchData['autocompleteInsights']): string {
    if (!autocomplete || autocomplete.results.length === 0) return 'No autocomplete data';
    const lines: string[] = [];
    for (const r of autocomplete.results) {
      if (r.suggestions.length > 0) {
        lines.push(`"${r.phrase}" → ${r.suggestions.slice(0, 5).join('; ')}`);
      }
    }
    return lines.length > 0 ? lines.join('. ') : 'No suggestions';
  }

  private summarizeCompetitors(competitorData: StoredResearchData['competitorData']): string {
    if (!competitorData) return 'No competitor data';
    const parts = [
      competitorData.competitors?.length ? competitorData.competitors.join(', ') : '',
      competitorData.priceRange,
      competitorData.rating,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join('. ') : 'No competitor data';
  }

  private summarizeAcademicPapers(block: AcademicPapersBlock | null): string {
    if (!block || block.papers.length === 0) return '';
    const lines = block.papers.map(
      (p) => `"${p.title}" (${p.year ?? 'n/a'}, ${p.citationCount} citations): ${p.abstractSnippet}`
    );
    return `Academic research (query: "${block.searchQuery}"):\n${lines.join('\n')}`;
  }

  private summarizeProductHunt(block: ProductHuntBlock | null): string {
    if (!block || block.posts.length === 0) return '';
    const lines = block.posts.slice(0, 10).map(
      (p: ProductHuntPost) => `"${p.name}" — ${p.tagline}${p.votesCount != null ? ` (${p.votesCount} votes)` : ''}`
    );
    return `Product Hunt launches (query: "${block.searchQuery}"):\n${lines.join('\n')}`;
  }
}
