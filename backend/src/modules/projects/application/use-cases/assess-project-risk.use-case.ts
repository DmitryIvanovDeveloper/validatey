import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TYPES } from '../../infrastructure/bootstrap/types';
import type { ProjectRiskAssessorPort } from '../ports/project-risk-assessor.port';
import type { AssessProjectRiskRequest, AssessProjectRiskResponse } from './input-output/assess-project-risk.io';

@injectable()
export class AssessProjectRiskUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort,
    @inject(TYPES.ProjectRiskAssessor)
    private readonly _assessor: ProjectRiskAssessorPort
  ) {}

  async execute(
    request: AssessProjectRiskRequest
  ): Promise<ResultEx<AssessProjectRiskResponse, Error>> {
    this._logger.info('assess-project-risk.start', {
      hypothesisLength: request.hypothesis.length,
      segmentLength: request.segment.length,
      assumptionsCount: request.assumptions.length,
    });

    try {
      const assessment = await this._assessor.assess(
        request.hypothesis,
        request.segment,
        request.assumptions
      );

      this._logger.info('assess-project-risk.success', {
        risksCount: assessment.risks.length,
        overallRiskScore: assessment.overallRiskScore,
      });

      return ResultEx.success({ assessment });
    } catch (error) {
      this._logger.error('assess-project-risk.error', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Risk assessment failed'));
    }
  }
}
