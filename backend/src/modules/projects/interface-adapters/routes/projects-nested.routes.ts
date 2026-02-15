import { Router } from 'express';
import scenariosNestedRoutes from '../../../scenarios/interface-adapters/routes/scenarios-nested.routes';
import invitationsNestedRoutes from '../../../invitations/interface-adapters/routes/invitations-nested.routes';
import reportsNestedRoutes from '../../../reports/interface-adapters/routes/reports-nested.routes';
import responsesNestedRoutes from '../../../responses/interface-adapters/routes/responses-nested.routes';
import earlySignalsNestedRoutes from '../../../signals/interface-adapters/routes/early-signals-nested.routes';
import researchNestedRoutes from '../../../research/interface-adapters/routes/research-nested.routes';
import scraperNestedRoutes from '../../../scraper/interface-adapters/routes/scraper-nested.routes';
import deletionRequestsNestedRoutes from '../../../deletion-requests/interface-adapters/routes/deletion-requests-nested.routes';
import consentsNestedRoutes from '../../../consents/interface-adapters/routes/consents-nested.routes';
import roundsNestedRoutes from '../../../rounds/interface-adapters/routes/rounds-nested.routes';
import overviewNestedRoutes from '../../../overview/interface-adapters/routes/overview-nested.routes';
import commentsNestedRoutes from '../../../comments/interface-adapters/routes/comments-nested.routes';

const router = Router({ mergeParams: true });

// Nested routes: /projects/:projectId/scenarios
router.use('/:projectId/scenarios', scenariosNestedRoutes);

// Nested routes: /projects/:projectId/invitations
router.use('/:projectId/invitations', invitationsNestedRoutes);

// Nested routes: /projects/:projectId/report
router.use('/:projectId/report', reportsNestedRoutes);

// Nested routes: /projects/:projectId/responses
router.use('/:projectId/responses', responsesNestedRoutes);

// Nested routes: /projects/:projectId/early-signals
router.use('/:projectId/early-signals', earlySignalsNestedRoutes);

// Nested routes: /projects/:projectId/research
router.use('/:projectId/research', researchNestedRoutes);

// Nested routes: /projects/:projectId/scraper
router.use('/:projectId/scraper', scraperNestedRoutes);

// Nested routes: /projects/:projectId/deletion-requests
router.use('/:projectId/deletion-requests', deletionRequestsNestedRoutes);

// Nested routes: /projects/:projectId/consents
router.use('/:projectId/consents', consentsNestedRoutes);

// Nested routes: /projects/:projectId/rounds
router.use('/:projectId/rounds', roundsNestedRoutes);

// Nested routes: /projects/:projectId/overview (command center)
router.use('/:projectId/overview', overviewNestedRoutes);

// Nested routes: /projects/:projectId/comments
router.use('/:projectId/comments', commentsNestedRoutes);

export default router;

