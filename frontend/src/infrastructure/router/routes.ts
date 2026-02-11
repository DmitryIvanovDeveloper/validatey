import { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/modules/auth/interface-adapters/views/LoginView.vue'),
    meta: { requiresAuth: false, layout: 'empty' },
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/modules/auth/interface-adapters/views/AuthCallbackView.vue'),
    meta: { requiresAuth: false, layout: 'empty' },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/shared/components/RootRedirectView.vue'),
    meta: { requiresAuth: false },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/modules/projects/interface-adapters/views/ProjectsListView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/new',
    name: 'create-project',
    component: () => import('@/modules/projects/interface-adapters/views/CreateProjectWizardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId',
    component: () => import('@/modules/projects/interface-adapters/views/ProjectDashboardView.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'project-details',
        component: () => import('@/modules/projects/interface-adapters/views/ProjectDetailsView.vue'),
      },
      {
        path: 'research',
        name: 'project-research',
        component: () => import('@/modules/research/interface-adapters/views/ResearchCanvasView.vue'),
      },
      {
        path: 'scraper',
        name: 'project-scraper',
        component: () => import('@/modules/scraper/interface-adapters/views/ScraperView.vue'),
      },
      {
        path: 'report',
        name: 'project-report',
        component: () => import('@/modules/project-reports/interface-adapters/views/ProjectReportView.vue'),
      },
      {
        path: 'invitations',
        name: 'project-invitations',
        component: () => import('@/modules/invitations/interface-adapters/views/InvitationManagerView.vue'),
      },
      {
        path: 'edit',
        name: 'project-edit',
        component: () => import('@/modules/projects/interface-adapters/views/CreateProjectWizardView.vue'),
      },
      {
        path: 'progress',
        name: 'project-progress',
        component: () => import('@/modules/projects/interface-adapters/views/ProjectProgressView.vue'),
      },
      {
        path: 'responses',
        name: 'project-responses',
        component: () => import('@/modules/projects/interface-adapters/views/ResponsesTableView.vue'),
      },
    ],
  },
  {
    path: '/admin/users',
    name: 'admin-users',
    component: () => import('@/modules/admin/interface-adapters/views/AdminUsersView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' },
  },
  {
    path: '/admin/feedback',
    name: 'admin-feedback',
    component: () => import('@/modules/feedback/interface-adapters/views/FeedbackListView.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, layout: 'admin' },
  },
  {
    path: '/integrations/hubspot/callback',
    name: 'hubspot-callback',
    component: () => import('@/modules/integrations/interface-adapters/views/HubSpotCallbackView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId/panel',
    name: 'project-panel',
    component: () => import('@/modules/projects/interface-adapters/views/RespondentPanelStubView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/survey/public/:slug',
    name: 'survey-public',
    component: () => import('@/modules/surveys/interface-adapters/views/SurveyPublicRedirectView.vue'),
    meta: {
      requiresAuth: false,
      layout: 'empty',
    },
  },
  {
    path: '/s/:slug',
    name: 'survey-public-short',
    component: () => import('@/modules/surveys/interface-adapters/views/SurveyPublicRedirectView.vue'),
    meta: {
      requiresAuth: false,
      layout: 'empty',
    },
  },
  {
    path: '/survey/:token',
    name: 'respondent-survey',
    component: () => import('@/modules/surveys/interface-adapters/views/SurveyView.vue'),
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
