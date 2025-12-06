import { Router } from 'express';
import scenariosNestedRoutes from '../../../scenarios/interface-adapters/routes/scenarios-nested.routes';
import invitationsNestedRoutes from '../../../invitations/interface-adapters/routes/invitations-nested.routes';
import reportsNestedRoutes from '../../../reports/interface-adapters/routes/reports-nested.routes';

const router = Router({ mergeParams: true });

// Nested routes: /projects/:projectId/scenarios
router.use('/:projectId/scenarios', scenariosNestedRoutes);

// Nested routes: /projects/:projectId/invitations
router.use('/:projectId/invitations', invitationsNestedRoutes);

// Nested routes: /projects/:projectId/report
router.use('/:projectId/report', reportsNestedRoutes);

export default router;

