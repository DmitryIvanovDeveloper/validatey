/** Ensure base URL is always absolute (has protocol). Prevents relative URLs and 404 on production. */
const normalizeBaseUrl = (raw: string): string => {
  const value = (raw || '').trim();
  if (!value) return 'http://localhost:8080/api';
  if (/^https?:\/\//i.test(value)) return value;
  // Host without protocol (e.g. "verity-gamma.vercel.app/api") → add https://
  const hostPath = value.replace(/^\//, '');
  return hostPath ? `https://${hostPath}` : 'http://localhost:8080/api';
};

const rawBase = import.meta.env.VITE_API_BASE_URL ?? '';
const apiBaseUrl = normalizeBaseUrl(rawBase || 'http://localhost:8080/api');

// Helper to get survey base URL (without /api)
const getSurveyBaseUrl = (): string => apiBaseUrl.replace(/\/api\/?$/, '');

export const API_CONFIG = {
  BASE_URL: apiBaseUrl,
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

    // Research (Canvas, Assistant, Collect, Synthesis)
    RESEARCH_CANVAS: (projectId: string) => `/projects/${projectId}/research/canvas`,
    RESEARCH_SYNTHESIS: (projectId: string) => `/projects/${projectId}/research/synthesis`,
    RESEARCH_COLLECT: (projectId: string) => `/projects/${projectId}/research/collect`,
    RESEARCH_ASSISTANT: (projectId: string) => `/projects/${projectId}/research/assistant`,

    // Scraper (data sources: competitor sites, reviews, job market, etc.)
    SCRAPER_SOURCES: (projectId: string) => `/projects/${projectId}/scraper`,
    SCRAPER_SOURCE: (projectId: string, id: string) => `/projects/${projectId}/scraper/${id}`,
    SCRAPER_RUN: (projectId: string, sourceId: string) => `/projects/${projectId}/scraper/${sourceId}/run`,
    SCRAPER_RESULTS: (projectId: string) => `/projects/${projectId}/scraper/results`,
    SCRAPER_PRESETS: (projectId: string) => `/projects/${projectId}/scraper/presets`,
    SCRAPER_SUGGEST: (projectId: string) => `/projects/${projectId}/scraper/suggest`,
    SCRAPER_STATS: (projectId: string) => `/projects/${projectId}/scraper/stats`,
    SCRAPER_GENERATE_INSIGHTS: (projectId: string, runId: string) => `/projects/${projectId}/scraper/runs/${runId}/generate-insights`,

    // Reports
    REPORT: (projectId: string) => `/projects/${projectId}/report`,
    REPORT_HTML: (projectId: string) => `/projects/${projectId}/report/html`,
    REPORT_PDF: (projectId: string) => `/projects/${projectId}/report/pdf`,

    // Rounds (iterative validation rounds per project)
    ROUNDS: (projectId: string) => `/projects/${projectId}/rounds`,
    ROUND: (projectId: string, roundId: string) => `/projects/${projectId}/rounds/${roundId}`,

    // Overview (command center: executive summary, pulse, smart actions, research context, decision pathway)
    OVERVIEW: (projectId: string) => `/projects/${projectId}/overview`,

    // Survey (Respondent UI) - Note: /survey route is mounted directly, not under /api
    SURVEY_BY_TOKEN: (token: string) => `${getSurveyBaseUrl()}/survey/${token}`,
    SURVEY_PUBLIC: (slug: string) => `${getSurveyBaseUrl()}/survey/public/${slug}`,
    SURVEY_CONSENT: (token: string) => `${getSurveyBaseUrl()}/survey/${token}/consent`,
    SUBMIT_RESPONSE: (token: string) => `/public/responses`,

    // AI Helper (hypothesis suggestions)
    AI_HYPOTHESIS_SUGGEST: '/ai/hypothesis-suggest',
    AI_MARKET_CONTEXT_SUGGEST: '/ai/market-context-suggest',
    AI_FORMAT_TEXT: '/ai/format-text',

    // Integrations
    HUBSPOT_STATUS: '/integrations/hubspot/status',
    HUBSPOT_AUTHORIZE: (returnTo?: string) => `/integrations/hubspot/authorize${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`,
    HUBSPOT_CALLBACK: '/integrations/hubspot/callback',
    HUBSPOT_CONTACTS: (segment?: string) => `/integrations/hubspot/contacts${segment ? `?segment=${encodeURIComponent(segment)}` : ''}`,

    // Auth (via backend; no Supabase on frontend)
    AUTH_GOOGLE_URL: '/auth/google-url',
    AUTH_REGISTER: '/auth/register',
    AUTH_LOGIN: '/auth/login',
    AUTH_SESSION: '/auth/session',
    AUTH_SIGN_OUT: '/auth/sign-out',

    // Admin
    ADMIN_USERS: '/admin/users',
    ADMIN_FEEDBACK: '/admin/feedback',
    ADMIN_FEEDBACK_ANALYZE: '/admin/feedback/analyze',

    // Feedback (widget submit)
    FEEDBACK: '/feedback',
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

export type ApiConfig = typeof API_CONFIG;
