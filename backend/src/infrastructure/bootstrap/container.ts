import 'reflect-metadata';
import { Container } from 'inversify';
import { LoggerPort } from '../logging/ports/logger.port';
import { ConsoleLogger } from '../logging/console-logger/index';
import { HttpClientPort } from '../http/ports/http-client.port';
import { HttpClient } from '../http/http-client';
import { EventBusPort } from '../event-bus/ports/event-bus.port';
import { EventBus } from '../event-bus/event-bus';
import { TYPES } from './types';
import { bindProjects } from '../../modules/projects/infrastructure/bootstrap/bind.projects';
import { bindScenarios } from '../../modules/scenarios/infrastructure/bootstrap/bind.scenarios';
import { bindInvitations } from '../../modules/invitations/infrastructure/bootstrap/bind.invitations';
import { bindTasks } from '../../modules/tasks/infrastructure/bootstrap/bind.tasks';
import { bindResponses } from '../../modules/responses/infrastructure/bootstrap/bind.responses';
import { bindMetrics } from '../../modules/metrics/infrastructure/bootstrap/bind.metrics';
import { bindReports } from '../../modules/reports/infrastructure/bootstrap/bind.reports';
import { bindStorage } from '../../modules/storage/infrastructure/bootstrap/bind.storage';
import { bindConsents } from '../../modules/consents/infrastructure/bootstrap/bind.consents';
import { bindSurveys } from '../../modules/surveys/infrastructure/bootstrap/bind.surveys';
import { bindAi } from '../../modules/ai/infrastructure/bootstrap/bind.ai';
import { bindSignals } from '../../modules/signals/infrastructure/bootstrap/bind.signals';
import { bindResearch } from '../../modules/research/infrastructure/bootstrap/bind.research';
import { bindScraper } from '../../modules/scraper/infrastructure/bootstrap/bind.scraper';
import { bindDeletionRequests } from '../../modules/deletion-requests/infrastructure/bootstrap/bind.deletion-requests';
import { bindAudit } from '../../modules/audit/infrastructure/bootstrap/bind.audit';
import { bindAdmin } from '../../modules/admin/infrastructure/bootstrap/bind.admin';
import { bindFeedback } from '../../modules/feedback/infrastructure/bootstrap/bind.feedback';
import { bindRounds } from '../../modules/rounds/infrastructure/bootstrap/bind.rounds';
import { bindOverview } from '../../modules/overview/infrastructure/bootstrap/bind.overview';
import { bindComments } from '../../modules/comments/infrastructure/bootstrap/bind.comments';
import { bindWorkspaces } from '../../modules/workspaces/infrastructure/bootstrap/bind.workspaces';
import { bindWishlist } from '../../modules/wishlist/infrastructure/bootstrap/bind.wishlist';

const container = new Container();

// Infrastructure bindings
container.bind<LoggerPort>(TYPES.Logger).to(ConsoleLogger);
container.bind<HttpClientPort>(TYPES.HttpClient).to(HttpClient);
container.bind<EventBusPort>(TYPES.EventBus).to(EventBus);

// Module bindings
bindProjects(container);
bindScenarios(container);
bindInvitations(container);
bindTasks(container);
bindResponses(container);
bindMetrics(container);
bindReports(container);
bindStorage(container);
bindConsents(container);
bindSurveys(container);
bindAi(container);
bindSignals(container);
bindResearch(container);
bindScraper(container);
bindDeletionRequests(container);
bindAudit(container);
bindAdmin(container);
bindFeedback(container);
bindRounds(container);
bindOverview(container);
bindComments(container);
bindWorkspaces(container);
bindWishlist(container);

export { container, TYPES };

