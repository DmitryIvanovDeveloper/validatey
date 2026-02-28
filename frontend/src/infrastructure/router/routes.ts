import { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/interface-adapters/ui/views/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'empty' },
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/modules/auth/interface-adapters/ui/views/AuthCallbackView.vue'),
    meta: { requiresAuth: false, layout: 'empty' },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/modules/auth/interface-adapters/ui/views/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'empty' },
  },
  {
    path: '/landing',
    name: 'landing',
    component: () => import('@/modules/landing/interface-adapters/ui/views/LandingPageView.vue'),
    meta: { requiresAuth: false, layout: 'empty' },
  },
  {
    path: '/view/:slug',
    name: 'project-dashboard-guest',
    component: () => import('@/modules/projects/interface-adapters/ui/views/ProjectDetailsGuestView.vue'),
    meta: { requiresAuth: false, layout: 'empty' },
  },
  {
    path: '/workspaces',
    name: 'workspaces',
    component: () => import('@/modules/workspaces/interface-adapters/ui/views/WorkspacesListView.vue'),
  },
  /* Comments are per-project: use /workspaces/:workspaceId/projects/:projectId/comments */
  {
    path: '/comments',
    redirect: () => ({ name: 'workspaces' }),
    meta: { requiresAuth: true },
  },
  {
    path: '/test',
    name: 'test',
    component: () => import('@/components/SessionTest.vue'),
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/modules/projects/interface-adapters/ui/views/ProjectsListView.vue'),
    meta: { skipAuthGuard: true },
  },
  {
    path: '/workspaces/:workspaceId/projects',
    name: 'workspace-projects',
    component: () => import('@/modules/projects/interface-adapters/ui/views/ProjectsListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/workspaces/:workspaceId/projects/new',
    name: 'create-project',
    component: () => import('@/modules/projects/interface-adapters/ui/views/CreateProjectWizardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/workspaces/:workspaceId/projects/:projectId',
    component: () => import('@/modules/projects/interface-adapters/ui/views/ProjectDashboardView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'project-details',
        component: () => import('@/modules/projects/interface-adapters/ui/views/ProjectDetailsView.vue'),
      },
      {
        path: 'scraper',
        name: 'project-scraper',
        component: () => import('@/modules/scraper/interface-adapters/ui/views/ScraperView.vue'),
      },
      {
        path: 'report',
        name: 'project-report',
        component: () => import('@/modules/project-reports/interface-adapters/ui/views/ProjectReportView.vue'),
      },
      {
        path: 'invitations',
        name: 'project-invitations',
        component: () => import('@/modules/invitations/interface-adapters/ui/views/InvitationManagerView.vue'),
      },
      {
        path: 'edit',
        name: 'project-edit',
        component: () => import('@/modules/projects/interface-adapters/ui/views/CreateProjectWizardView.vue'),
      },
      {
        path: 'responses',
        name: 'project-responses',
        component: () => import('@/modules/responses/interface-adapters/ui/views/ResponsesTableView.vue'),
      },
      {
        path: 'comments',
        name: 'project-comments',
        component: () => import('@/modules/comments/interface-adapters/ui/views/CommentsView.vue'),
      },
      {
        path: 'rounds/:roundId',
        name: 'round-detail',
        component: () => import('@/modules/rounds/interface-adapters/ui/views/RoundDetailView.vue'),
      },
    ],
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/modules/admin/interface-adapters/ui/views/AdminUsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' },
  },
  {
    path: '/admin/feedback',
    name: 'admin-feedback',
    component: () => import('@/modules/feedback/interface-adapters/ui/views/FeedbackListView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' },
  },
  {
    path: '/admin/wishlist',
    name: 'admin-wishlist',
    component: () => import('@/modules/admin/interface-adapters/ui/components/AdminWaitlistTab.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' },
  },
  {
    path: '/integrations/hubspot/callback',
    name: 'hubspot-callback',
    component: () => import('@/modules/integrations/interface-adapters/ui/views/HubSpotCallbackView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/workspaces/:workspaceId/projects/:projectId/panel',
    name: 'project-panel',
    component: () => import('@/modules/projects/interface-adapters/ui/views/RespondentPanelStubView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/survey/public/:slug',
    name: 'survey-public',
    component: () => import('@/modules/surveys/interface-adapters/ui/views/SurveyPublicRedirectView.vue'),
    meta: {
      requiresAuth: false,
      layout: 'empty',
    },
  },
  {
    path: '/s/:slug',
    name: 'survey-public-short',
    component: () => import('@/modules/surveys/interface-adapters/ui/views/SurveyPublicRedirectView.vue'),
    meta: {
      requiresAuth: false,
      layout: 'empty',
    },
  },
  {
    path: '/survey/:token',
    name: 'respondent-survey',
    component: () => import('@/modules/surveys/interface-adapters/ui/views/SurveyView.vue'),
    meta: {
      requiresAuth: false,
      layout: 'empty',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/shared/components/NotFoundView.vue'),
    meta: { requiresAuth: false },
  },
];
