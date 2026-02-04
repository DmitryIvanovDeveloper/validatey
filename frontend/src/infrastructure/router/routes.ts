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
    component: () => import('@/shared/components/LandingView.vue'),
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
    name: 'project-details',
    component: () => import('@/modules/projects/interface-adapters/views/ProjectDetailsView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId/progress',
    name: 'project-progress',
    component: () => import('@/modules/projects/interface-adapters/views/ProjectProgressView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId/report',
    name: 'project-report',
    component: () => import('@/modules/project-reports/interface-adapters/views/ProjectReportView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId/invitations',
    name: 'project-invitations',
    component: () => import('@/modules/invitations/interface-adapters/views/InvitationManagerView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/projects/:projectId/panel',
    name: 'project-panel',
    component: () => import('@/modules/projects/interface-adapters/views/RespondentPanelStubView.vue'),
    meta: { requiresAuth: true },
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
