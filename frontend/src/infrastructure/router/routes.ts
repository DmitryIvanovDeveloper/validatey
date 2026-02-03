import { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/modules/projects/interface-adapters/views/DashboardView.vue'),
    meta: {
      requiresAuth: false, // TODO: будет true после добавления авторизации
    },
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('@/modules/projects/interface-adapters/views/ProjectsListView.vue'),
  },
  {
    path: '/projects/new',
    name: 'create-project',
    component: () => import('@/modules/projects/interface-adapters/views/CreateProjectWizardView.vue'),
  },
  {
    path: '/projects/:projectId',
    name: 'project-details',
    component: () => import('@/modules/projects/interface-adapters/views/ProjectDetailsView.vue'),
  },
  {
    path: '/projects/:projectId/progress',
    name: 'project-progress',
    component: () => import('@/modules/projects/interface-adapters/views/ProjectProgressView.vue'),
  },
  {
    path: '/projects/:projectId/report',
    name: 'project-report',
    component: () => import('@/modules/project-reports/interface-adapters/views/ProjectReportView.vue'),
  },
  {
    path: '/projects/:projectId/invitations',
    name: 'project-invitations',
    component: () => import('@/modules/invitations/interface-adapters/views/InvitationManagerView.vue'),
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/modules/auth/interface-adapters/views/AuthCallbackView.vue'),
    meta: { requiresAuth: false, layout: 'empty' },
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
  },
];
