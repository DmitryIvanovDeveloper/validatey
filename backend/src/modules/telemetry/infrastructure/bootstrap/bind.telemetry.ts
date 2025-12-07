import { Container } from 'inversify';
import { TYPES } from './types';
import { SubmitTelemetryUseCase } from '../../application/use-cases/submit-telemetry.use-case';
import { TelemetryPresenter } from '../../interface-adapters/presenters/telemetry.presenter';

export function bindTelemetry(container: Container): void {
  // Use Cases
  container.bind<SubmitTelemetryUseCase>(TYPES.SubmitTelemetryUseCase).to(SubmitTelemetryUseCase);

  // Presenter
  container.bind<TelemetryPresenter>(TYPES.TelemetryPresenter).to(TelemetryPresenter);
}


