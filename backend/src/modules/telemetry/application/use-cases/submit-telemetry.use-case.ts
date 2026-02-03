import { injectable, inject } from 'inversify';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import { LoggerPort } from '../../../../infrastructure/logging/ports/logger.port';
import ResultEx from '../../../../infrastructure/result/result';
import { TelemetryEventEntity } from '../../domain/entities/telemetry-event.entity';
import { SubmitTelemetryUseCaseRequest, SubmitTelemetryUseCaseResponse } from './input-output/submit-telemetry.io';

@injectable()
export class SubmitTelemetryUseCase {
  constructor(
    @inject(ROOT_TYPES.Logger)
    private readonly _logger: LoggerPort
  ) {}

  async execute(
    request: SubmitTelemetryUseCaseRequest
  ): Promise<ResultEx<SubmitTelemetryUseCaseResponse, Error>> {
    this._logger.info('submit-telemetry.start', { type: request.type });

    try {
      const timestamp = request.timestamp ? new Date(request.timestamp) : undefined;
      const event = TelemetryEventEntity.create(
        request.type,
        request.page,
        request.eventName,
        request.step,
        request.metadata,
        timestamp
      );

      // TODO: Save to database or analytics service
      // For now, just log it
      this._logger.info('submit-telemetry.event', {
        type: event.type,
        page: event.page,
        eventName: event.eventName,
        step: event.step,
      });

      return ResultEx.success({ success: true });
    } catch (error) {
      this._logger.error('submit-telemetry.error', { error });
      return ResultEx.failure(error instanceof Error ? error : new Error('Unknown error'));
    }
  }
}



