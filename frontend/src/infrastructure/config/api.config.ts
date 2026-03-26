/**
 * Normalizes VITE_API_BASE_URL for browser usage.
 * - Supports absolute URLs (https://...) for cases without rewrites
 * - Supports relative paths like `/api` for Vercel rewrites + same-origin cookies
 */
const normalizeBaseUrl = (raw: string): string => {
  const value = (raw || '').trim();
  if (!value) return '/api';
  // Allow relative base paths (e.g. `/api`), works with Vercel rewrites and Vite proxy.
  if (value.startsWith('/')) return value;
  // Force same-origin usage: even if an absolute backend URL is provided,
  // we want cookies/session to be set for the current frontend host via /api rewrite.
  const trimmed = value.replace(/\/+$/, '');
  if (/\/api$/i.test(trimmed)) return '/api';
  if (/^https?:\/\//i.test(value)) return value;
  // Host without protocol (e.g. "verity-gamma.vercel.app/api") → add https://
  const hostPath = value.replace(/^\//, '');
  return hostPath ? `https://${hostPath}` : '/api';
};

const rawBase = import.meta.env.VITE_API_BASE_URL ?? '';
// Default to same-origin relative `/api` (Vercel rewrites / Vite proxy).
const apiBaseUrl = normalizeBaseUrl(rawBase || '/api');

// Helper to get survey base URL (without `/api`)
const getSurveyBaseUrl = (): string => apiBaseUrl.replace(/\/api\/?$/, '');

export const API_CONFIG = {
  BASE_URL: apiBaseUrl,
  ENDPOINTS: {
    // Projects
    PROJECTS: '/projects',
    PROJECT: (id: string) => `/projects/${id}`,
    PROJECT_WITH_GUEST: (id: string, guestSlug: string) =>
      `/projects/${id}?guestSlug=${encodeURIComponent(guestSlug)}`,
    PUBLIC_PROJECT_BY_SLUG: (slug: string) =>
      `/public/projects/by-slug/${encodeURIComponent(slug)}`,
    
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
    SUGGEST_PLATFORMS: (projectId: string) => `/projects/${projectId}/invitations/suggest-platforms`,
    
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

    // Research (Canvas, Assistant, Collect, Synthesis, Availability/Cooldown)
    RESEARCH_CANVAS: (projectId: string) => `/projects/${projectId}/research/canvas`,
    RESEARCH_AVAILABILITY: (projectId: string) => `/projects/${projectId}/research/availability`,
    RESEARCH_SYNTHESIS: (projectId: string) => `/projects/${projectId}/research/synthesis`,
    RESEARCH_COLLECT: (projectId: string) => `/projects/${projectId}/research/collect`,
    RESEARCH_ASSISTANT: (projectId: string) => `/projects/${projectId}/research/assistant`,
    RESEARCH_USER_STORIES: (projectId: string) => `/projects/${projectId}/research/user-stories`,

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
    OVERVIEW_WITH_GUEST: (projectId: string, guestSlug: string) =>
      `/projects/${projectId}/overview?guestSlug=${encodeURIComponent(guestSlug)}`,

    // Comments (patterns, suggested outreach, etc.)
    COMMENTS_PATTERNS: (projectId: string) => `/projects/${projectId}/comments/patterns`,
    COMMENTS_SUGGESTED_OUTREACH: (projectId: string) => `/projects/${projectId}/comments/suggested-outreach`,

    // Project Landings
    PROJECT_LANDINGS: '/project-landings',

    /** POST multipart (field audio) / GET list — nested under /api/projects/:projectId */
    PROJECT_TRANSCRIPTIONS: (projectId: string) => `/projects/${projectId}/transcription`,
    PROJECT_TRANSCRIPTION_BY_ID: (projectId: string, transcriptionId: string) =>
      `/projects/${projectId}/transcription/${transcriptionId}`,
    PROJECT_TRANSCRIPTION_INSIGHTS: (projectId: string) => `/projects/${projectId}/transcription/insights`,

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
    AUTH_LINK_PREVIOUS_USER: '/auth/link-previous-user',
    AUTH_SIGN_OUT: '/auth/sign-out',

    // Admin
    ADMIN_USERS: '/admin/users',
    ADMIN_FEEDBACK: '/admin/feedback',
    ADMIN_FEEDBACK_ANALYZE: '/admin/feedback/analyze',
    ADMIN_WISHLIST: '/admin/wishlist',

    // Feedback (widget submit)
    FEEDBACK: '/feedback',

    // Wishlist (waitlist for landing pages)
    WISHLIST: '/wishlist',
    WISHLIST_COUNT: '/wishlist/count',
    WISHLIST_BY_PROJECT: (projectId: string) => `/projects/${projectId}/wishlist`,
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

export type ApiConfig = typeof API_CONFIG;
