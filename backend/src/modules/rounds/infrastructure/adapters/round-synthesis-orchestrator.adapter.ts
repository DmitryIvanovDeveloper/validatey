import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { TYPES as ROUNDS_TYPES } from '../bootstrap/types';
import { TYPES as RESEARCH_TYPES } from '../../../research/infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import type { RoundRepositoryPort } from '../../application/ports/round-repository.port';
import type { ResearchDataRepositoryPort } from '../../../research/application/ports/research-data-repository.port';
import type { RoundResults } from '../../domain/entities/round.entity';
import { RoundEntity } from '../../domain/entities/round.entity';
import { RoundNotFoundError } from '../../domain/errors/round.error';

export interface FinalizeRoundResult {
  roundId: string;
  verdict: string | null;
  keyFinding: string | null;
  confidence: number;
  nextQuestions: string[];
}

/**
 * Infrastructure Orchestrator: reads synthesis from ResearchDataRepository (research module)
 * and writes the verdict back into Round.results (rounds module).
 * Lives in infrastructure layer — allowed to cross module boundaries via ports.
 */
@injectable()
export class RoundSynthesisOrchestratorAdapter {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(ROUNDS_TYPES.RoundRepository)
    private readonly _roundRepository: RoundRepositoryPort,
    @inject(RESEARCH_TYPES.ResearchDataRepository)
    private readonly _researchRepository: ResearchDataRepositoryPort
  ) {}

  async finalize(
    projectId: string,
    roundId: string
  ): Promise<ResultEx<FinalizeRoundResult, RoundNotFoundError | Error>> {
    this._logger.info('round-synthesis-orchestrator.finalize.start', { projectId, roundId });

    try {
      // 1. Load the round
      const roundResult = await this._roundRepository.findById(roundId);
      if (!roundResult.isSuccess) {
        return ResultEx.failure(new RoundNotFoundError(roundId));
      }
      const round = roundResult.data;
      if (round.projectId !== projectId) {
        return ResultEx.failure(new RoundNotFoundError(roundId));
      }

      // 2. Read latest synthesis for the project
      const researchResult = await this._researchRepository.findByProjectId(projectId);
      const synthesis = researchResult.isSuccess ? researchResult.data?.synthesisReport : null;

      // 3. Map verdict → confidence score
      const verdictMap: Record<string, number> = {
        validated: 0.9,
        'needs-more-data': 0.5,
        rejected: 0.1,
      };
      const verdict = synthesis?.verdict ?? null;
      const confidence = verdict != null ? (verdictMap[verdict] ?? 0.5) : 0.5;

      // 4. Build results
      const results: RoundResults = {
        keyFinding: synthesis?.summary ?? 'Synthesis not yet generated for this project.',
        confidence,
        nextQuestions: synthesis?.recommendations
          ? [...synthesis.recommendations].slice(0, 5)
          : [],
      };

      // 5. Mark round as completed and attach results
      const roundEntity = RoundEntity.fromData(round);
      const completedRound = roundEntity.withStatus('completed').withResults(results);
      const updateResult = await this._roundRepository.update(completedRound.toData());
      if (!updateResult.isSuccess) {
        return ResultEx.failure(updateResult.error);
      }

      this._logger.info('round-synthesis-orchestrator.finalize.done', {
        projectId,
        roundId,
        verdict,
        confidence,
      });

      return ResultEx.success({ roundId, verdict, keyFinding: results.keyFinding!, confidence, nextQuestions: results.nextQuestions! });
    } catch (error) {
      this._logger.error('round-synthesis-orchestrator.finalize.error', { projectId, roundId, error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}
