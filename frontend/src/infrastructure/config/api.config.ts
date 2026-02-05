// Helper to get survey base URL (without /api)
const getSurveyBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  return baseUrl.replace('/api', '');
};

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  ENDPOINTS: {
    // Projects
    PROJECTS: '/projects',
    PROJECT: (id: string) => `/projects/${id}`,
    
    // Scenarios
    SCENARIOS: (projectId: string) => `/projects/${projectId}/scenarios`,
    SCENARIO: (projectId: string, scenarioId: string) => `/projects/${projectId}/scenarios/${scenarioId}`,
    /** POST body: { projectId, content, metadata? } - creates new scenario version */
    SCENARIOS_SAVE_VERSION: '/scenarios',
    /** GET - list scenario templates */
    SCENARIOS_TEMPLATES: '/scenarios/templates',
    /** POST body: { projectId, scenarioId, rating } - save scenario quality rating (1-5) */
    SCENARIOS_RATE: '/scenarios/rate',
    /** POST body: { scenarioContent, templateSlug } - validate scenario structure (returns { valid, warnings }) */
    SCENARIOS_VALIDATE: '/scenarios/validate',

    // Invitations
    INVITATIONS: (projectId: string) => `/projects/${projectId}/invitations`,
    INVITATION: (projectId: string, invitationId: string) => `/projects/${projectId}/invitations/${invitationId}`,
    SEND_INVITATIONS: (projectId: string) => `/projects/${projectId}/invitations/send`,
    
    // Responses
    RESPONSES: (projectId: string) => `/responses/project/${projectId}`, // Using direct endpoint until nested route works
    RESPONSE: (projectId: string, responseId: string) => `/projects/${projectId}/responses/${responseId}`,
    /** GET ?format=json|csv - export raw responses (attachment) */
    RESPONSES_EXPORT: (projectId: string, format: 'json' | 'csv') => `/projects/${projectId}/responses/export?format=${format}`,
    RESPONSES_MODERATION: (projectId: string, status?: string) => `/projects/${projectId}/responses/moderation${status ? `?status=${status}` : ''}`,
    RESPONSE_MODERATE: (projectId: string, responseId: string) => `/projects/${projectId}/responses/${responseId}/moderation`,
    /** GET ?format=json|csv - export consents for audit (attachment) */
    CONSENTS_EXPORT: (projectId: string, format: 'json' | 'csv') => `/projects/${projectId}/consents/export?format=${format}`,
    /** GET - list deletion requests for project; POST to execute: .../deletion-requests/:requestId/execute */
    DELETION_REQUESTS: (projectId: string) => `/projects/${projectId}/deletion-requests`,
    DELETION_REQUEST_EXECUTE: (projectId: string, requestId: string) => `/projects/${projectId}/deletion-requests/${requestId}/execute`,

    // Early Signals
    EARLY_SIGNALS: (projectId: string) => `/projects/${projectId}/early-signals`,

    // Reports
    REPORT: (projectId: string) => `/projects/${projectId}/report`,
    REPORT_HTML: (projectId: string) => `/projects/${projectId}/report/html`,
    REPORT_PDF: (projectId: string) => `/projects/${projectId}/report/pdf`,
    
    // Survey (Respondent UI) - Note: /survey route is mounted directly, not under /api
    SURVEY_BY_TOKEN: (token: string) => `${getSurveyBaseUrl()}/survey/${token}`,
    SURVEY_PUBLIC: (slug: string) => `${getSurveyBaseUrl()}/survey/public/${slug}`,
    SURVEY_CONSENT: (token: string) => `${getSurveyBaseUrl()}/survey/${token}/consent`,
    SUBMIT_RESPONSE: (token: string) => `/public/responses`,
    
    // Analytics/Telemetry
    TELEMETRY: '/telemetry',

    // AI Helper (hypothesis suggestions)
    AI_HYPOTHESIS_SUGGEST: '/ai/hypothesis-suggest',
    AI_MARKET_CONTEXT_SUGGEST: '/ai/market-context-suggest',
    AI_FORMAT_TEXT: '/ai/format-text',

    // Auth (via backend; no Supabase on frontend)
    AUTH_GOOGLE_URL: '/auth/google-url',
    AUTH_REGISTER: '/auth/register',
    AUTH_LOGIN: '/auth/login',
    AUTH_SESSION: '/auth/session',
    AUTH_LINK_PREVIOUS_USER: '/auth/link-previous-user',
    AUTH_SIGN_OUT: '/auth/sign-out',
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

export type ApiConfig = typeof API_CONFIG;
