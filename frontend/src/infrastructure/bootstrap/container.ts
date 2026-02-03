import 'reflect-metadata';
import { Container } from 'inversify';
import { LoggerPort } from '../logging/ports/logger.port';
import { ConsoleLogger } from '../logging/console-logger';
import { HttpClientPort } from '../http/ports/http-client.port';
import { HttpClient } from '../http/http-client';
import { EventBusPort } from '../event-bus/ports/event-bus.port';
import { EventBus } from '../event-bus/event-bus';
import { TYPES } from './types';
import { bindProjects } from '../../modules/projects/infrastructure/bootstrap/bind.projects';
import { bindScenarios } from '../../modules/scenarios/infrastructure/bootstrap/bind.scenarios';
import { bindInvitations } from '../../modules/invitations/infrastructure/bootstrap/bind.invitations';
import { bindProjectReports } from '../../modules/project-reports/infrastructure/bootstrap/bind.project-reports';
import { bindSurveys } from '../../modules/surveys/infrastructure/bootstrap/bind.surveys';
import { bindSurveyResponses } from '../../modules/survey-responses/infrastructure/bootstrap/bind.survey-responses';
import { bindAuth } from '../../modules/auth/infrastructure/bootstrap/bind.auth';
import { TelemetryPort } from '../../shared/services/ports/telemetry.port';
import { TelemetryService } from '../../shared/services/telemetry.service';

const container = new Container();

// Infrastructure bindings
container.bind<LoggerPort>(TYPES.Logger).to(ConsoleLogger);
container.bind<HttpClientPort>(TYPES.HttpClient).to(HttpClient);
container.bind<EventBusPort>(TYPES.EventBus).to(EventBus);
container.bind<TelemetryPort>(TYPES.Telemetry).to(TelemetryService);

// Module bindings
bindProjects(container);
bindScenarios(container);
bindInvitations(container);
bindProjectReports(container);
bindSurveys(container);
bindSurveyResponses(container);
bindAuth(container);

export { container, TYPES };
