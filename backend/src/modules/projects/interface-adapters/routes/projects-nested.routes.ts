import { Router } from 'express';
import scenariosNestedRoutes from '../../../scenarios/interface-adapters/routes/scenarios-nested.routes';
import invitationsNestedRoutes from '../../../invitations/interface-adapters/routes/invitations-nested.routes';
import reportsNestedRoutes from '../../../reports/interface-adapters/routes/reports-nested.routes';
import responsesNestedRoutes from '../../../responses/interface-adapters/routes/responses-nested.routes';
import earlySignalsNestedRoutes from '../../../signals/interface-adapters/routes/early-signals-nested.routes';

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

export default router;

