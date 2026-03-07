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
import { GetPublicProjectMetaBySlugUseCase } from '../../modules/projects/application/use-cases/get-public-project-meta-by-slug.use-case';
import { TYPES as PROJECT_TYPES } from '../../modules/projects/infrastructure/bootstrap/types';
import { bindScenarios } from '../../modules/scenarios/infrastructure/bootstrap/bind.scenarios';
import { bindInvitations } from '../../modules/invitations/infrastructure/bootstrap/bind.invitations';
import { bindProjectReports } from '../../modules/project-reports/infrastructure/bootstrap/bind.project-reports';
import { bindSurveys } from '../../modules/surveys/infrastructure/bootstrap/bind.surveys';
import { bindSurveyResponses } from '../../modules/survey-responses/infrastructure/bootstrap/bind.survey-responses';
import { bindAuth } from '../../modules/auth/infrastructure/bootstrap/bind.auth';
import { bindScraper } from '../../modules/scraper/infrastructure/bootstrap/bind.scraper';
import { bindResearch } from '../../modules/research/infrastructure/bootstrap/bind.research';
import { bindResponses } from '../../modules/responses/infrastructure/bootstrap/bind.responses';
import { bindComments } from '../../modules/comments/infrastructure/bootstrap/bind.comments';
import { bindWorkspaces } from '../../modules/workspaces/infrastructure/bootstrap/bind.workspaces';
import { bindWishlist } from '../../modules/wishlist/infrastructure/bootstrap/bind.wishlist';
import { bindFeedback } from '../../modules/feedback/infrastructure/bootstrap/bind.feedback';
import { bindProjectLanding } from '../../modules/project-landing/infrastructure/bootstrap/bind.project-landing';
const container = new Container();

// Infrastructure bindings
container.bind<LoggerPort>(TYPES.Logger).to(ConsoleLogger);
container.bind<HttpClientPort>(TYPES.HttpClient).to(HttpClient);
container.bind<EventBusPort>(TYPES.EventBus).to(EventBus);
// Module bindings
bindProjects(container);
// Fallback: ensure GetPublicProjectMetaBySlugUseCase is bound (avoids "No bindings found" when resolving ProjectPresenter)
if (!container.isBound(PROJECT_TYPES.GetPublicProjectMetaBySlugUseCase)) {
  container.bind<GetPublicProjectMetaBySlugUseCase>(PROJECT_TYPES.GetPublicProjectMetaBySlugUseCase).to(GetPublicProjectMetaBySlugUseCase);
}
bindScenarios(container);
bindInvitations(container);
bindProjectReports(container);
bindSurveys(container);
bindSurveyResponses(container);
bindAuth(container);
bindScraper(container);
bindResearch(container);
bindResponses(container);
bindComments(container);
bindWorkspaces(container);
bindWishlist(container);
bindFeedback(container);
bindProjectLanding(container);

export { container, TYPES };
