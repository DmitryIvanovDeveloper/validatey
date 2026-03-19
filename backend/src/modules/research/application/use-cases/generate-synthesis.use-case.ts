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
import { TYPES as WISHLIST_TYPES } from '../../../wishlist/application/types';
import { TYPES as PROJECT_TRANSCRIPTION_TYPES } from '../../../project-transcription/infrastructure/bootstrap/types';
import type { ProjectRepositoryPort } from '../../../projects/application/ports/project-repository.port';
import type { WishlistRepositoryPort } from '../../../wishlist/application/ports/wishlist-repository.port';
import type { EarlySignalsRepositoryPort } from '../../../signals/application/ports/early-signals-repository.port';
import type { ResearchDataRepositoryPort } from '../ports/research-data-repository.port';
import type { SynthesisLlmPort } from '../ports/synthesis-llm.port';
import type { ProjectTranscriptionRepositoryPort } from '../../../project-transcription/application/ports/project-transcription-repository.port';
import type { TranscriptionInsightsLlmPort } from '../../../project-transcription/application/ports/transcription-insights-llm.port';
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
import type { CommentPatternAnalysis, EvidenceType, DataConfidence } from '../../../comments/domain/value-objects/comment-pattern-analysis.vo';
import type { AcademicPapersBlock } from '../../domain/value-objects/academic-papers-block.vo';
import type { ProductHuntBlock, ProductHuntPost } from '../../domain/value-objects/product-hunt-block.vo';
import type { CommentMetrics } from '../ports/synthesis-llm.port';
import type { TranscriptionInsightsOutput } from '../../../project-transcription/application/ports/transcription-insights-llm.port';

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
    private readonly _generateAssumptionAssessmentsUseCase: GenerateAssumptionAssessmentsUseCase,
    @inject(WISHLIST_TYPES.WishlistRepository)
    private readonly _wishlistRepository: WishlistRepositoryPort,
    @inject(PROJECT_TRANSCRIPTION_TYPES.ProjectTranscriptionRepository)
    private readonly _projectTranscriptionRepository: ProjectTranscriptionRepositoryPort,
    @inject(PROJECT_TRANSCRIPTION_TYPES.TranscriptionInsightsLlmPort)
    private readonly _transcriptionInsightsLlm: TranscriptionInsightsLlmPort,
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

      const [storedResult, signalsResult, wishlistCountResult] = await Promise.all([
        this._researchDataRepository.findByProjectId(projectId),
        this._signalsRepository.findByProjectId(projectId),
        this._wishlistRepository.count(projectId),
      ]);
      const stored = storedResult.isSuccess ? storedResult.data : null;
      const signals = signalsResult.isSuccess ? signalsResult.data : [];
      const waitlistSubscribersCount = wishlistCountResult.isSuccess ? wishlistCountResult.data : undefined;

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
      const commentMetrics = this.buildCommentMetrics(comments);

      const painPointsFromResponses = this.extractPainPointsFromResponses(responses);
      const earlySignalsSummary =
        signals.length > 0
        ? signals.map((s) => `[${s.type}] ${s.title}: ${s.description}`).join('. ')
        : 'No early signals yet';
      const academicPapersSummary = this.summarizeAcademicPapers(stored?.academicPapers ?? null);
      const productHuntSummary = this.summarizeProductHunt(stored?.productHunt ?? null);
      await this.refreshTranscriptionInsights(projectId, project.userId);
      const transcriptionInsightsSummary = await this.loadTranscriptionInsightsSummary(projectId);

      const SYNTHESIS_BATCH_SIZE = 40;
      const useBatchSynthesis = comments.length > SYNTHESIS_BATCH_SIZE;

      let report: SynthesisReport;
      let synthesisPatternAnalysis: CommentPatternAnalysis | null;

      if (useBatchSynthesis) {
        this._logger.info('generate-synthesis.batch-mode', {
          projectId,
          totalComments: comments.length,
          batchSize: SYNTHESIS_BATCH_SIZE,
          numBatches: Math.ceil(comments.length / SYNTHESIS_BATCH_SIZE),
        });
        const batchAnalyses: CommentPatternAnalysis[] = [];
        for (let i = 0; i < comments.length; i += SYNTHESIS_BATCH_SIZE) {
          const batch = comments.slice(i, i + SYNTHESIS_BATCH_SIZE);
          const batchNumbered = this.buildNumberedCommentsWithIds(batch);
          const batchSummary = this.summarizeComments(batch);
          const batchResult = await this._synthesisLlm.generateSynthesis({
            projectName: project.name,
            hypothesisSummary,
            marketSummary,
            competitorSummary,
            autocompleteSummary,
            userInsightsSummary,
            commentsSummary: batchSummary,
            commentsNumberedWithIds: batchNumbered || undefined,
            earlySignalsSummary,
            academicPapersSummary,
            productHuntSummary,
            commentMetrics: { totalCount: comments.length, bySource: commentMetrics.bySource },
            waitlistSubscribersCount,
            transcriptionInsightsSummary,
          });
          if (batchResult.isSuccess && batchResult.data.commentPatternAnalysis) {
            const validated = this.validatePatternExamples(batchResult.data.commentPatternAnalysis, batch);
            batchAnalyses.push(validated);
          }
        }
        if (batchAnalyses.length === 0) {
          // Fallback: one LLM call with a sample of comments (avoids rate limit and yields pattern analysis)
          const SINGLE_PASS_SAMPLE = 80;
          const sample = comments.slice(0, SINGLE_PASS_SAMPLE);
          const sampleSummary = this.summarizeComments(sample);
          const sampleNumbered = this.buildNumberedCommentsWithIds(sample);
          this._logger.info('generate-synthesis.batch-fallback-single-pass', {
            projectId,
            totalComments: comments.length,
            sampleSize: sample.length,
          });
          const fallbackResult = await this._synthesisLlm.generateSynthesis({
            projectName: project.name,
            hypothesisSummary,
            marketSummary,
            competitorSummary,
            autocompleteSummary,
            userInsightsSummary,
            commentsSummary: sampleSummary,
            commentsNumberedWithIds: sampleNumbered || undefined,
            earlySignalsSummary,
            academicPapersSummary,
            productHuntSummary,
            commentMetrics,
            waitlistSubscribersCount,
            transcriptionInsightsSummary,
          });
          if (!fallbackResult.isSuccess) {
            return ResultEx.failure(fallbackResult.error);
          }
          report = fallbackResult.data;
          synthesisPatternAnalysis = fallbackResult.data.commentPatternAnalysis ?? null;
          if (synthesisPatternAnalysis) {
            synthesisPatternAnalysis = this.validatePatternExamples(synthesisPatternAnalysis, sample);
            // Enrich and merge will run below on full comments
          }
        } else {
          const merged = this.mergePatternAnalyses(batchAnalyses, comments.length);
          synthesisPatternAnalysis = this.enrichPatternCommentIdsFromExamples(merged, comments);
          synthesisPatternAnalysis = this.enrichUniqueAuthorCounts(synthesisPatternAnalysis, comments);
          const mergedSummary = this.formatMergedPatternSummary(synthesisPatternAnalysis);
          const finalResult = await this._synthesisLlm.generateSynthesis({
            projectName: project.name,
            hypothesisSummary,
            marketSummary,
            competitorSummary,
            autocompleteSummary,
            userInsightsSummary,
            commentsSummary: `Merged from ${comments.length} comments (${batchAnalyses.length} batches). Use pattern summary for verdict.`,
            commentPatternSummary: mergedSummary,
            earlySignalsSummary,
            academicPapersSummary,
            productHuntSummary,
            commentMetrics,
            waitlistSubscribersCount,
            transcriptionInsightsSummary,
          });
          if (!finalResult.isSuccess) return ResultEx.failure(finalResult.error);
          report = {
            summary: finalResult.data.summary,
            recommendations: finalResult.data.recommendations ?? [],
            verdict: finalResult.data.verdict,
            sections: finalResult.data.sections,
            commentPatternAnalysis: synthesisPatternAnalysis,
          };
        }
      } else {
        const commentsSummary = this.summarizeComments(comments);
        const commentsNumberedWithIds = this.buildNumberedCommentsWithIds(comments);
        const commentPatternAnalysis = stored?.commentPatternAnalysis ?? null;
        const llmResult = await this._synthesisLlm.generateSynthesis({
          projectName: project.name,
          hypothesisSummary,
          marketSummary,
          competitorSummary,
          autocompleteSummary,
          userInsightsSummary,
          commentsSummary,
          commentsNumberedWithIds: commentsNumberedWithIds || undefined,
          earlySignalsSummary,
          academicPapersSummary: academicPapersSummary || undefined,
          productHuntSummary: productHuntSummary || undefined,
          commentMetrics,
          waitlistSubscribersCount,
          transcriptionInsightsSummary,
        });
        if (!llmResult.isSuccess) return ResultEx.failure(llmResult.error);
        report = llmResult.data;
        synthesisPatternAnalysis = report.commentPatternAnalysis ?? commentPatternAnalysis;
      }

      // Enrich and finalize pattern analysis.
      // IMPORTANT: this must happen BEFORE building adjustedReport so that synthesis_report column
      // also stores the finalized patterns (evidenceType, dataConfidence, deterministic score).
      if (synthesisPatternAnalysis && comments.length > 0) {
        synthesisPatternAnalysis = this.validatePatternExamples(synthesisPatternAnalysis, comments);
        // Keyword-based matching (primary): uses LLM-provided pattern keywords for precise comment attribution
        synthesisPatternAnalysis = this.matchCommentsByKeywords(synthesisPatternAnalysis, comments);
        // Example-based matching (fallback for patterns that got no commentIds from keywords)
        synthesisPatternAnalysis = this.enrichPatternCommentIdsFromExamples(synthesisPatternAnalysis, comments);
        synthesisPatternAnalysis = this.enrichUniqueAuthorCounts(synthesisPatternAnalysis, comments);
        synthesisPatternAnalysis = this.enrichSubredditCountsPerPattern(synthesisPatternAnalysis, comments);
        synthesisPatternAnalysis = this.finalizePatternAnalysis(synthesisPatternAnalysis);
        // Propagate finalized CPA back into the report so synthesis_report column is consistent
        report = { ...report, commentPatternAnalysis: synthesisPatternAnalysis };
      }

      // Adjust verdict based on comment pattern validation score (Domain логика)
      const adjustedReport = this.adjustVerdictByCommentPatterns(report, synthesisPatternAnalysis, comments.length);

      // Now extract pain points using the FRESH CPA (synthesisPatternAnalysis) so even the first
      // run gets meaningful pain points rather than falling back to keyword-matched raw quotes.
      const painPointsFromComments = this.extractPainPointsFromComments(comments, synthesisPatternAnalysis);
      const allPainPoints = [...new Set([...painPointsFromResponses, ...painPointsFromComments])]

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
        userStories: stored?.userStories ?? null,
        userStoriesGeneratedAt: stored?.userStoriesGeneratedAt ?? null,
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

  private async loadTranscriptionInsightsSummary(projectId: string): Promise<string | undefined> {
    const insightsResult = await this._projectTranscriptionRepository.getInsightsByProjectId(projectId);
    if (!insightsResult.isSuccess || !insightsResult.data) {
      return undefined;
    }
    return this.formatTranscriptionInsights(insightsResult.data);
  }

  private async refreshTranscriptionInsights(projectId: string, userId: string): Promise<void> {
    const listResult = await this._projectTranscriptionRepository.listByProjectId(projectId, 500, 0);
    if (!listResult.isSuccess) {
      this._logger.warn('generate-synthesis.transcription-insights-list-failed', {
        projectId,
        error: listResult.error,
      });
      return;
    }
    if (listResult.data.length === 0) {
      return;
    }

    const llmResult = await this._transcriptionInsightsLlm.generateInsights({
      projectId,
      history: listResult.data.map((t) => ({
        id: t.id,
        originalFilename: t.originalFilename,
        createdAtIso: t.createdAt.toISOString(),
        transcript: t.transcript,
        language: t.language,
      })),
    });
    if (!llmResult.isSuccess) {
      this._logger.warn('generate-synthesis.transcription-insights-llm-failed', {
        projectId,
        error: llmResult.error,
      });
      return;
    }

    const saveResult = await this._projectTranscriptionRepository.saveInsights({
      projectId,
      userId,
      payload: llmResult.data,
    });
    if (!saveResult.isSuccess) {
      this._logger.warn('generate-synthesis.transcription-insights-save-failed', {
        projectId,
        error: saveResult.error,
      });
    }
  }

  private formatTranscriptionInsights(insights: TranscriptionInsightsOutput): string {
    const lines: string[] = [];
    if (insights.summary?.trim()) {
      lines.push(`Summary: ${insights.summary.trim()}`);
    }
    if (insights.insights.length) {
      lines.push(`Insights: ${insights.insights.join('; ')}`);
    }
    if (insights.themes.length) {
      lines.push(`Themes: ${insights.themes.join('; ')}`);
    }
    if (insights.risks.length) {
      lines.push(`Risks: ${insights.risks.join('; ')}`);
    }
    if (insights.nextActions.length) {
      lines.push(`Next actions: ${insights.nextActions.join('; ')}`);
    }
    return lines.length ? lines.join('\n') : 'No transcription insights yet';
  }

  /**
   * Validate that examples in each pattern are actual verbatim substrings of batch comments.
   * Filters out fabricated quotes to prevent misleading citations.
   */
  private validatePatternExamples(
    analysis: CommentPatternAnalysis,
    batchComments: CommentEntity[]
  ): CommentPatternAnalysis {
    if (!batchComments || batchComments.length === 0) return analysis;
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const commentTexts = batchComments.map((c) => normalize(c.content));

    const patterns = analysis.patterns.map((p) => {
      if (!p.examples || p.examples.length === 0) return p;
      const verified = p.examples.filter((ex) => {
        const needle = normalize(ex.content).slice(0, 150);
        if (!needle || needle.length < 10) return false;
        return commentTexts.some((text) => text.includes(needle));
      });
      if (verified.length === p.examples.length) return p;
      return { ...p, examples: verified };
    });

    return { ...analysis, patterns };
  }

  /**
   * Post-enrichment finalization: derive evidenceType, dataConfidence, compute
   * deterministic validationScore, classifiedComments and coverageRatio.
   * Must be called AFTER enrichUniqueAuthorCounts.
   */
  private finalizePatternAnalysis(analysis: CommentPatternAnalysis): CommentPatternAnalysis {
    const total = analysis.totalComments;

    // Step 1: derive evidenceType and dataConfidence per pattern
    const patterns = analysis.patterns.map((p) => {
      const evidenceType = this.deriveEvidenceType(p);
      const dataConfidence = this.deriveDataConfidence(p);
      return { ...p, evidenceType, dataConfidence };
    });

    // Step 2: deterministic validationScore from real commentIds
    const validationScore = this.computeDeterministicScore(patterns, total);

    // Step 3: coverage stats
    const allClassified = new Set<string>();
    for (const p of patterns) {
      for (const id of p.commentIds ?? []) allClassified.add(id);
    }
    const classifiedComments = allClassified.size;
    const coverageRatio = total > 0 ? Math.round((classifiedComments / total) * 100) / 100 : 0;

    return { ...analysis, patterns, validationScore, classifiedComments, coverageRatio };
  }

  private deriveEvidenceType(pattern: CommentPatternAnalysis['patterns'][number]): EvidenceType {
    const alternativeTypes = new Set(['comparison', 'workaround']);
    if (pattern.supportsHypothesis === false) {
      return alternativeTypes.has(pattern.type) ? 'alternative' : 'contradictory';
    }
    if (pattern.supportsHypothesis === true) return 'direct';
    if (alternativeTypes.has(pattern.type)) return 'alternative';
    return 'neutral';
  }

  private deriveDataConfidence(pattern: CommentPatternAnalysis['patterns'][number]): DataConfidence {
    const ids = pattern.commentIds?.length ?? 0;
    if (ids === 0) return 'none';
    if (ids >= 5) return 'high';
    if (ids >= 2) return 'medium';
    return 'low';
  }

  /**
   * Deterministic validation score based on real comment coverage and author diversity.
   * Formula: supportRatio * 100 * diversityFactor - contradictPenalty
   * This replaces the LLM-estimated score which was inconsistent.
   */
  private computeDeterministicScore(
    patterns: ReadonlyArray<CommentPatternAnalysis['patterns'][number]>,
    totalComments: number
  ): number {
    if (totalComments === 0) return 0;

    const supportIds = new Set<string>();
    const contradictIds = new Set<string>();
    let supportAuthorSum = 0;
    let supportPatternCount = 0;

    for (const p of patterns) {
      const ids = p.commentIds ?? [];
      const isSupporting = p.supportsHypothesis === true || (p.supportsHypothesis == null && p.type !== 'comparison' && p.type !== 'workaround');
      const isContra = p.supportsHypothesis === false;

      if (isSupporting) {
        for (const id of ids) supportIds.add(id);
        if (ids.length > 0) {
          supportAuthorSum += p.uniqueAuthorCount ?? ids.length;
          supportPatternCount++;
        }
      } else if (isContra) {
        for (const id of ids) contradictIds.add(id);
      }
    }

    const supportRatio = supportIds.size / totalComments;
    const contradictRatio = contradictIds.size / totalComments;
    const avgAuthors = supportPatternCount > 0 ? supportAuthorSum / supportPatternCount : 0;
    const diversityFactor = Math.min(1, avgAuthors / 10);

    const raw = supportRatio * 100 * (0.6 + 0.4 * diversityFactor) - contradictRatio * 50;
    return Math.min(100, Math.max(0, Math.round(raw)));
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
   * Build a numbered list of comments with their UUIDs for LLM pattern assignment.
   * Used so the LLM can return commentIds as UUID strings in each pattern.
   */
  private buildNumberedCommentsWithIds(comments: CommentEntity[]): string {
    if (!comments || comments.length === 0) return '';
    // Keep prompt under LLM context limit (~8k tokens): cap comments and preview length (aligned with batch size)
    const maxComments = 40;
    const previewLen = 160;
    const slice = comments.slice(0, maxComments);
    const lines = slice.map((c, i) => {
      const preview = c.content.replace(/\s+/g, ' ').trim().substring(0, previewLen);
      const escaped = preview.replace(/"/g, '\\"');
      return `${i + 1}. [id: ${c.id}] "${escaped}${c.content.length > previewLen ? '...' : ''}"`;
    });
    return lines.join('\n');
  }

  /**
   * When LLM returns patterns with examples but empty commentIds, resolve comment IDs by
   * matching example content to project comments so the UI can show "Show N comments" and load from API.
   */
  /**
   * Deterministic comment matching based on LLM-provided keywords.
   * For each pattern that has keywords, scans every comment and assigns it when
   * the comment contains >= minMatches of the pattern keywords (case-insensitive substring).
   *
   * We intentionally do NOT apply a hypothesis-derived domain filter here: we don't know the
   * user's domain vocabulary in advance, and a poorly-worded hypothesis would either over-block
   * valid comments or pass everything through. Domain relevance is instead achieved by requiring
   * the LLM to supply specific, pattern-level keywords (not generic terms like "tool" or "user").
   */
  private matchCommentsByKeywords(
    analysis: CommentPatternAnalysis,
    comments: CommentEntity[],
  ): CommentPatternAnalysis {
    const MAX_IDS_PER_PATTERN = 100;

    const patterns = analysis.patterns.map((p) => {
      const kws = p.keywords;
      if (!kws || kws.length === 0) return p;

      const normalizedKws = kws.map((k) => k.toLowerCase().trim()).filter((k) => k.length > 1);
      if (normalizedKws.length === 0) return p;

      /**
       * Build a whole-word regex for a keyword.
       * Handles single words ("honest" → /\bhonest\b/i) and multi-word phrases
       * ("data leak" → /\bdata\s+leak\b/i).
       * Word boundaries prevent "honestly" matching "honest", "giving" matching "give", etc.
       */
      const buildWordRegex = (kw: string): RegExp => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
        return new RegExp(`\\b${escaped}\\b`, 'i');
      };
      const kwRegexes = normalizedKws.map((kw) => ({ kw, re: buildWordRegex(kw) }));

      // Pre-compute per-keyword frequency using word-boundary matching.
      // Keywords appearing in >40% of comments are "common" — they need a "rare" partner.
      const COMMON_THRESHOLD = 0.4;
      const kwFrequency = new Map<string, number>();
      for (const { kw, re } of kwRegexes) {
        const freq = comments.filter((c) => re.test(c.content)).length / Math.max(1, comments.length);
        kwFrequency.set(kw, freq);
      }
      const rareEntries = kwRegexes.filter(({ kw }) => (kwFrequency.get(kw) ?? 0) < COMMON_THRESHOLD);
      const commonEntries = kwRegexes.filter(({ kw }) => (kwFrequency.get(kw) ?? 0) >= COMMON_THRESHOLD);

      /**
       * PASS 1 — strict: ≥2 rare keywords, OR ≥1 rare + ≥1 common, OR ≥2 common (all-common list).
       * This keeps false positives low when the LLM provides good discriminating phrases.
       */
      const matchedIds: string[] = [];
      for (const comment of comments) {
        if (matchedIds.length >= MAX_IDS_PER_PATTERN) break;
        const rareMatches = rareEntries.filter(({ re }) => re.test(comment.content)).length;
        const commonMatches = commonEntries.filter(({ re }) => re.test(comment.content)).length;
        const qualifies = rareMatches >= 2
          || (rareMatches >= 1 && commonMatches >= 1)
          || (rareEntries.length === 0 && commonMatches >= 2);
        if (qualifies) matchedIds.push(comment.id);
      }

      /**
       * PASS 2 — fallback (any single keyword match) when strict pass found < 2 comments.
       * This handles cases where: the LLM used single-word keywords, the corpus is small,
       * or the hypothesis is in a niche domain with rare vocabulary.
       * For contradictory patterns (supportsHypothesis: false), require at least 2 keyword
       * matches in fallback to reduce off-topic comments (e.g. single "feedback" or "problem").
       */
      if (matchedIds.length < 2) {
        const fallbackIds = new Set(matchedIds);
        const isContradictory = p.supportsHypothesis === false;
        for (const comment of comments) {
          if (fallbackIds.size >= MAX_IDS_PER_PATTERN) break;
          if (fallbackIds.has(comment.id)) continue;
          const rareMatches = rareEntries.filter(({ re }) => re.test(comment.content)).length;
          const commonMatches = commonEntries.filter(({ re }) => re.test(comment.content)).length;
          const matchCount = rareMatches + commonMatches;
          const qualifies = isContradictory ? matchCount >= 2 : matchCount >= 1;
          if (qualifies) fallbackIds.add(comment.id);
        }
        if (fallbackIds.size > matchedIds.length) {
          matchedIds.length = 0;
          fallbackIds.forEach((id) => matchedIds.push(id));
        }
      }

      if (matchedIds.length === 0) return p;

      // Generate a server-side example from the best-matching comment.
      // This replaces any LLM-provided examples so the displayed quote is always from a
      // verified, domain-relevant comment — not an off-topic one the LLM happened to quote.
      const idSet = new Set(matchedIds);
      const matchedComments = comments.filter((c) => idSet.has(c.id));
      const bestExample = this.extractBestExample(matchedComments, kwRegexes.map(({ re }) => re));

      return {
        ...p,
        commentIds: matchedIds,
        examples: bestExample ? [bestExample] : [],
      };
    });

    return { ...analysis, patterns };
  }

  /**
   * Find the comment with the most keyword matches and extract a 120-char window
   * centred on the first keyword hit. This produces a tight, relevant snippet.
   */
  private extractBestExample(
    matchedComments: CommentEntity[],
    kwRegexes: RegExp[],
  ): { content: string; author: string; source: string } | null {
    if (matchedComments.length === 0) return null;

    // Score each comment by keyword matches + a bonus for shorter (more focused) comments.
    // Shorter comments tend to be more on-topic; very long technical discussions often contain
    // the keywords incidentally.
    const MAX_LEN_FOR_BONUS = 500;
    const scored = matchedComments.map((c) => ({
      comment: c,
      score: kwRegexes.filter((re) => re.test(c.content)).length
        + (c.content.length <= MAX_LEN_FOR_BONUS ? 0.5 : 0),
    }));
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0].comment;

    // Decode common HTML entities so the snippet is human-readable
    const decodeHtml = (s: string) =>
      s.replace(/&#x27;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"')
       .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/g, '/');

    const text = decodeHtml(best.content);

    // Find the position of the first keyword hit to centre the snippet there
    let hitPos = 0;
    for (const re of kwRegexes) {
      const m = re.exec(text);
      if (m) { hitPos = m.index; break; }
    }

    // Extract ≤120 chars around the hit; start at a word boundary to avoid mid-word cuts
    const SNIPPET = 120;
    const rawStart = Math.max(0, hitPos - 20);
    // Advance to the next space so we don't start mid-word (unless at the very beginning)
    const wordStart = rawStart > 0 ? (text.indexOf(' ', rawStart) + 1 || rawStart) : 0;
    const slice = text.slice(wordStart, wordStart + SNIPPET).replace(/\s+/g, ' ').trim();
    // Trim to last full word and add ellipsis if truncated
    const isPartial = wordStart > 0 || (wordStart + SNIPPET) < text.length;
    const trimmed = isPartial ? slice.replace(/\s\S*$/, '') : slice;
    const content = isPartial && trimmed.length < slice.length ? trimmed + '…' : trimmed;

    // Derive a human-readable source name.
    // subsourceName for Reddit contains the subreddit (e.g. "indiebiz" or "r/indiebiz").
    // For Hacker News it contains things like "Hacker News Search" — don't prepend "r/" there.
    const sub = best.subsourceName ?? '';
    let source: string;
    if (!sub) {
      source = 'Community';
    } else if (sub.startsWith('r/')) {
      source = sub;
    } else if (/hacker|hackernews|hn\b/i.test(sub)) {
      source = 'Hacker News';
    } else if (/reddit/i.test(sub)) {
      source = sub;
    } else {
      // Looks like a bare subreddit name (e.g. "indiebiz") — add "r/" prefix
      source = sub.includes('/') ? sub : `r/${sub}`;
    }

    return {
      content,
      author: best.author ?? 'Anonymous',
      source,
    };
  }

  private enrichPatternCommentIdsFromExamples(
    analysis: CommentPatternAnalysis,
    comments: CommentEntity[]
  ): CommentPatternAnalysis {
    const MAX_IDS_PER_PATTERN = 100;
    const normalizedContent = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();
    const significantWords = (s: string) =>
      normalizedContent(s).split(/\s+/).filter((w) => w.length >= 4);

    const patterns = analysis.patterns.map((p) => {
      const hasIds = p.commentIds && p.commentIds.length > 0;
      if (hasIds) return p;
      const examples = p.examples ?? [];
      if (examples.length === 0) return p;

      const matchedIds = new Set<string>();
      for (const ex of examples) {
        const needle = normalizedContent(ex.content).slice(0, 150);
        if (!needle) continue;
        for (const c of comments) {
          if (matchedIds.size >= MAX_IDS_PER_PATTERN) break;
          const hay = normalizedContent(c.content);
          if (hay.includes(needle) || needle.includes(hay)) {
            matchedIds.add(c.id);
          }
        }
      }
      // Fallback: match by significant words (e.g. "structured", "feedback", "data")
      if (matchedIds.size === 0) {
        const allWords = new Set<string>();
        for (const ex of examples) {
          significantWords(ex.content).forEach((w) => allWords.add(w));
        }
        if (allWords.size >= 2) {
          const wordList = Array.from(allWords);
          for (const c of comments) {
            if (matchedIds.size >= MAX_IDS_PER_PATTERN) break;
            const commentWords = new Set(significantWords(c.content));
            const matchCount = wordList.filter((w) => commentWords.has(w)).length;
            if (matchCount >= 2) matchedIds.add(c.id);
          }
        }
      }
      if (matchedIds.size === 0) return p;
      return { ...p, commentIds: Array.from(matchedIds) };
    });

    return { ...analysis, patterns };
  }

  /**
   * Enrich each pattern with uniqueAuthorCount from commentIds and comment entities.
   * Many unique authors = stronger validation signal (avoids one vocal user dominating).
   */
  private enrichUniqueAuthorCounts(
    analysis: CommentPatternAnalysis,
    comments: CommentEntity[]
  ): CommentPatternAnalysis {
    const idToAuthor = new Map<string, string>();
    for (const c of comments) {
      const author = (c.author && String(c.author).trim()) || 'Anonymous';
      idToAuthor.set(c.id, author);
    }

    const patterns = analysis.patterns.map((p) => {
      const ids = p.commentIds ?? [];
      if (ids.length === 0) return p;
      const authors = new Set<string>();
      for (const id of ids) {
        const a = idToAuthor.get(id);
        if (a) authors.add(a);
      }
      return { ...p, uniqueAuthorCount: authors.size };
    });

    return { ...analysis, patterns };
  }

  /**
   * For each pattern, set subredditCount and subredditNames from comments (by commentIds and comment.subsourceName).
   */
  private enrichSubredditCountsPerPattern(
    analysis: CommentPatternAnalysis,
    comments: CommentEntity[]
  ): CommentPatternAnalysis {
    const idToSubsource = new Map<string, string>();
    for (const c of comments) {
      const sub = c.subsourceName && String(c.subsourceName).trim();
      if (sub && (sub.startsWith('r/') || sub.includes('r/'))) idToSubsource.set(c.id, sub);
    }
    const patterns = analysis.patterns.map((p) => {
      const ids = p.commentIds ?? [];
      if (ids.length === 0) return p;
      const subreddits = new Set<string>();
      for (const id of ids) {
        const sub = idToSubsource.get(id);
        if (sub) subreddits.add(sub);
      }
      if (subreddits.size === 0) return p;
      return {
        ...p,
        subredditCount: subreddits.size,
        subredditNames: [...subreddits],
      };
    });
    return { ...analysis, patterns };
  }


  /** Max commentIds per pattern after merging batches (avoids one pattern dominating). */
  private static readonly MAX_COMMENT_IDS_PER_PATTERN = 80;

  /**
   * Merge pattern analyses from multiple batches: group by type, keep best pattern metadata per type,
   * but union commentIds from all batches for that type (dedupe, cap at MAX_COMMENT_IDS_PER_PATTERN).
   */
  private mergePatternAnalyses(
    batchAnalyses: CommentPatternAnalysis[],
    totalComments: number
  ): CommentPatternAnalysis {
    const byType = new Map<string, Array<{ pattern: typeof batchAnalyses[0]['patterns'][0]; batchIdx: number }>>();
    for (let bi = 0; bi < batchAnalyses.length; bi++) {
      const analysis = batchAnalyses[bi];
      for (const p of analysis.patterns ?? []) {
        const key = p.type;
        if (!byType.has(key)) byType.set(key, []);
        byType.get(key)!.push({ pattern: p, batchIdx: bi });
      }
    }
    const mergedPatterns: Array<CommentPatternAnalysis['patterns'][number]> = [];
    for (const [, items] of byType) {
      const best = items.reduce(
        (acc, { pattern }) => ((pattern.count ?? 0) > (acc.count ?? 0) ? pattern : acc),
        items[0].pattern
      );
      // Union commentIds from all batches (legacy LLM UUIDs; may be empty post-keyword migration)
      const allIds = new Set<string>();
      for (const { pattern } of items) {
        for (const id of pattern.commentIds ?? []) {
          allIds.add(id);
        }
      }
      const ids = Array.from(allIds).slice(0, GenerateSynthesisUseCase.MAX_COMMENT_IDS_PER_PATTERN);
      // Union keywords from all batches so cross-batch patterns get complete keyword coverage
      const allKeywords = new Set<string>();
      for (const { pattern } of items) {
        for (const kw of pattern.keywords ?? []) {
          allKeywords.add(kw.toLowerCase().trim());
        }
      }
      const mergedKeywords = allKeywords.size > 0 ? Array.from(allKeywords) : undefined;
      const count = ids.length > 0 ? ids.length : (best.count ?? 0);
      mergedPatterns.push({
        ...best,
        count,
        percentage: totalComments > 0 ? Math.round((count / totalComments) * 100) : 0,
        commentIds: ids.length > 0 ? ids : undefined,
        keywords: mergedKeywords,
      });
    }
    mergedPatterns.sort((a: { count: number }, b: { count: number }) => b.count - a.count);
    const first = batchAnalyses[0];
    return {
      totalComments,
      patterns: mergedPatterns,
      // validationScore will be recomputed deterministically in finalizePatternAnalysis
      validationScore: 0,
      sentimentOverview: first?.sentimentOverview ?? { overall: 0, distribution: { positive: 33, neutral: 34, negative: 33 } },
      platformInsights: first?.platformInsights,
      temporalTrends: first?.temporalTrends ?? { recentActivity: 0.5, trendDirection: 'stable' },
      analyzedAt: new Date(),
    };
  }

  /**
   * Format merged pattern analysis as text for the final summary/verdict LLM call.
   */
  private formatMergedPatternSummary(analysis: CommentPatternAnalysis): string {
    const lines = analysis.patterns.map((p) => {
      const authors = p.uniqueAuthorCount != null ? ` (${p.uniqueAuthorCount} unique authors)` : '';
      return `${p.type}: ${p.label} — count ${p.count}${authors}, ${p.percentage}%. ${p.insight}`;
    });
    return `Merged comment patterns (${analysis.totalComments} total comments):\n${lines.join('\n')}\nValidation score: ${analysis.validationScore}/100`;
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
   * Includes 1–2 "problem validation" insights (supporting patterns that describe the problem the product solves)
   * so Top Pain Points reflect both the core problem and risks/objections.
   */
  private extractPainPointsFromComments(
    comments: CommentEntity[],
    patternAnalysis: CommentPatternAnalysis | null
  ): string[] {
    if (!comments || comments.length === 0) {
      return [];
    }

    const extractedPains: string[] = [];

    if (patternAnalysis) {
      const allPatterns = patternAnalysis.patterns;

      // 1) Add up to 2 "problem validation" insights — supporting patterns that describe the problem the product solves
      // (e.g. struggle to discover tools, frustration with discovery) so the widget shows the core pain, not only objections.
      const problemTypes = ['problem_statement', 'frustration', 'pain_points'];
      const problemLower = (s: string) => s.toLowerCase();
      const problemKeywords = ['struggle', 'discover', 'frustrat', 'finding', 'find the right', 'inefficient', 'difficult', 'need for'];
      const problemValidation = allPatterns
        .filter(
          (p) =>
            p.supportsHypothesis === true &&
            (problemTypes.includes(p.type) || problemKeywords.some((kw) => p.insight && problemLower(p.insight).includes(kw)))
        )
        .slice(0, 2);
      for (const p of problemValidation) {
        if (p.insight && p.insight.length > 20 && p.insight.length < 300 && !extractedPains.includes(p.insight)) {
          extractedPains.push(p.insight);
        }
      }

      // 2) Add contradicting or negative-sentiment patterns (risks/objections). Score: contradicting > negative; tiebreak by confidenceScore
      const scored = allPatterns
        .map((p) => {
          let typeScore = 0;
          if (p.supportsHypothesis === false) typeScore = 3;
          else if (p.sentimentScore < -0.1) typeScore = 2;
          else if (p.sentimentScore < 0.2) typeScore = 1;
          return { pattern: p, score: typeScore * (p.confidenceScore ?? 1) };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);

      const maxTotal = 6;
      for (const { pattern } of scored) {
        if (extractedPains.length >= maxTotal) break;
        if (pattern.insight && pattern.insight.length > 20 && pattern.insight.length < 300 && !extractedPains.includes(pattern.insight)) {
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

    return extractedPains.slice(0, 6); // Up to 6: 1–2 problem validation + up to 4 risks/objections
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

    // Reddit recurrence: same theme in multiple subreddits = strong validation signal
    const insights = analysis.platformInsights;
    if (insights?.subredditDistribution && Object.keys(insights.subredditDistribution).length > 0) {
      const subCount = Object.keys(insights.subredditDistribution).length;
      parts.push(`Comments from ${subCount} subreddit(s): ${Object.entries(insights.subredditDistribution).map(([k, v]) => `${k}=${v}`).join(', ')}`);
      if (typeof insights.recurrenceScore === 'number' && insights.recurrenceScore > 0) {
        parts.push(`Recurrence score: ${(insights.recurrenceScore * 100).toFixed(0)}% (same patterns appearing across multiple communities = stronger signal)`);
      }
    }

    // Group patterns by type for better context
    const byType: Record<string, Array<typeof analysis.patterns[number]>> = {};
    for (const pattern of analysis.patterns) {
      if (!byType[pattern.type]) {
        byType[pattern.type] = [];
      }
      byType[pattern.type].push(pattern);
    }

    // Add key insights from top patterns (include subreddit count when available)
    for (const [type, patterns] of Object.entries(byType)) {
      const topPattern = patterns[0]; // Most common pattern of this type
      const subInfo = topPattern.subredditCount != null && topPattern.subredditCount > 0
        ? `, in ${topPattern.subredditCount} subreddit(s)`
        : '';
      parts.push(
        `${type}: ${topPattern.label} (${topPattern.count} comments${subInfo}, ${topPattern.percentage}%) - ${topPattern.insight}`
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
