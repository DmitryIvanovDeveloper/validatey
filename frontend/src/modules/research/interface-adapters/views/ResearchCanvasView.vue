<template>
  <div class="research-canvas-view">
    <PageHeader
      :title="'Research Assistant'"
      :subtitle="projectName || 'Loading…'"
      :breadcrumbs="breadcrumbs"
    >
      <template #actions>
        <router-link v-if="projectId" :to="`/projects/${projectId}`" class="btn btn-ghost btn-back">
          <span class="btn-icon" aria-hidden="true">←</span>
          Back
        </router-link>
        <button
          type="button"
          class="btn btn-primary"
          :disabled="collectLoading || !projectId"
          @click="startResearchMarket"
        >
          <span v-if="collectLoading" class="btn-spinner" aria-hidden="true"></span>
          {{ collectLoading ? 'Researching…' : 'Research market with AI' }}
        </button>
      </template>
    </PageHeader>

    <div v-if="loading" class="state state-loading">
      <div class="loading-dots">
        <span></span><span></span><span></span>
      </div>
      <p>Loading Research Assistant…</p>
    </div>
    <div v-else-if="error" class="state state-error">
      <span class="state-icon" aria-hidden="true">!</span>
      <p class="error-text">{{ error }}</p>
    </div>
    <div v-else-if="canvas" class="content">
      <!-- Progress when researching market -->
      <section v-if="collectLoading" class="section collect-progress-section">
        <div class="card collect-progress-card">
          <p class="collect-progress-title">Researching market with AI</p>
          <ul class="collect-progress-steps" aria-busy="true">
            <li class="step-done"><span class="step-check" aria-hidden="true">✓</span> Gathering market size from open sources</li>
            <li class="step-done"><span class="step-check" aria-hidden="true">✓</span> Finding main competitors and their pricing</li>
            <li class="step-done"><span class="step-check" aria-hidden="true">✓</span> Analyzing trends and niches</li>
          </ul>
          <p class="collect-progress-eta">Takes 30–60 seconds</p>
        </div>
      </section>

      <!-- 1. QUICK START -->
      <section class="section quick-start-section">
        <div class="card quick-start-card">
          <h2 class="card-title">Quick Start</h2>
          <p class="quick-start-intro">Validate this hypothesis now</p>
          <ul v-if="recommendedTemplate" class="quick-start-list">
            <li><strong>Recommended method:</strong> {{ recommendedTemplate.name }}</li>
            <li><strong>Time:</strong> 2–3 days</li>
            <li><strong>Cost:</strong> Free (public link)</li>
          </ul>
          <router-link v-if="projectId" :to="`/projects/${projectId}/invitations`" class="btn btn-primary btn-cta">
            Launch Validation
          </router-link>
        </div>
      </section>

      <!-- Optional: geography & segment (collapsed under "Research market" context) -->
      <section class="section collect-options-section collect-optional">
        <p class="collect-options-label">Narrow research (optional):</p>
        <div class="collect-options-row">
          <input
            v-model="collectGeography"
            type="text"
            class="collect-option-input"
            placeholder="Geography (e.g. US, EU)"
            :disabled="collectLoading"
          />
          <input
            v-model="collectSegment"
            type="text"
            class="collect-option-input"
            placeholder="Segment (e.g. B2B SMB)"
            :disabled="collectLoading"
          />
        </div>
      </section>
      <div v-if="collectError || synthesisError" class="alerts">
        <div v-if="collectError" class="alert alert-error" role="alert">{{ collectError }}</div>
        <div v-if="synthesisError" class="alert alert-error" role="alert">{{ synthesisError }}</div>
      </div>

      <!-- 2. WHAT WE KNOW (auto-generated synthesis + data blocks) -->
      <section v-if="synthesisReport" class="section synthesis-section">
        <div class="card synthesis-card">
          <div class="card-head">
            <span class="synthesis-badge">Auto-generated</span>
            <h2 class="card-title">Summary</h2>
          </div>
          <p class="synthesis-summary">{{ synthesisReport.summary }}</p>
          <ul v-if="synthesisReport.recommendations?.length" class="synthesis-list">
            <li v-for="(r, i) in synthesisReport.recommendations" :key="i">
              <span class="list-bullet" aria-hidden="true"></span>
              {{ r }}
            </li>
          </ul>
        </div>
      </section>

      <section class="section blocks-section">
        <h2 class="section-heading">What we know</h2>
        <div class="canvas-grid">
          <div class="card canvas-block market-block">
            <div class="block-head">
              <span class="block-icon market-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
              </span>
              <h3 class="block-title">Market Intelligence</h3>
              <span v-if="hasMarketData" class="block-status">Collected</span>
            </div>
            <div v-if="hasMarketData" class="block-content block-insights">
              <ul class="block-list insights-list">
                <li v-if="canvas.marketData.size">Market size: {{ canvas.marketData.size }}</li>
                <li v-if="canvas.marketData.growth">{{ canvas.marketData.growth }} growth → good time to enter</li>
                <li v-if="canvas.marketData.trends?.length" v-for="(t, i) in canvas.marketData.trends" :key="i">{{ t }}</li>
              </ul>
              <p v-if="marketInsightText" class="insight-highlight">{{ marketInsightText }}</p>
            </div>
            <div v-else class="block-empty">
              <p>No market data yet.</p>
              <p class="block-hint">Use «Research market with AI» above to gather market size and trends.</p>
            </div>
          </div>
          <div class="card canvas-block competitor-block">
            <div class="block-head">
              <span class="block-icon competitor-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </span>
              <h3 class="block-title">Competitive Landscape</h3>
              <span v-if="hasCompetitorData" class="block-status">Collected</span>
            </div>
            <div v-if="hasCompetitorData" class="block-content block-insights">
              <ul v-if="canvas.competitorInfo.competitors?.length" class="block-list insights-list">
                <li v-for="c in canvas.competitorInfo.competitors" :key="c">{{ c }}</li>
              </ul>
              <p v-if="canvas.competitorInfo.priceRange" class="insight-line">Prices: {{ canvas.competitorInfo.priceRange }}</p>
              <p v-if="canvas.competitorInfo.rating" class="insight-line">Rating: {{ canvas.competitorInfo.rating }}</p>
            </div>
            <div v-else class="block-empty">
              <p>No competitor data yet.</p>
              <p class="block-hint">Use «Research market with AI» to get main players and pricing.</p>
            </div>
          </div>
          <div class="card canvas-block autocomplete-block">
            <div class="block-head">
              <span class="block-icon autocomplete-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              </span>
              <h3 class="block-title">Search Suggestions (Google Places)</h3>
              <span v-if="hasAutocompleteInsights" class="block-status">Collected</span>
            </div>
            <div v-if="hasAutocompleteInsights" class="block-content block-insights">
              <p class="block-subtitle">What people search for in your market</p>
              <div v-for="(r, idx) in canvas.autocompleteInsights?.results" :key="idx" class="autocomplete-phrase-group">
                <p class="autocomplete-phrase"><strong>{{ r.phrase }}</strong></p>
                <ul v-if="r.suggestions?.length" class="block-list insights-list autocomplete-suggestions">
                  <li v-for="(s, i) in r.suggestions" :key="i">{{ s }}</li>
                </ul>
              </div>
            </div>
            <div v-else class="block-empty">
              <p>No search suggestions yet.</p>
              <p class="block-hint">Use «Research market with AI» to gather Google Place Autocomplete data.</p>
            </div>
          </div>
          <div class="card canvas-block insights-block">
            <div class="block-head">
              <span class="block-icon insights-icon" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/></svg>
              </span>
              <h3 class="block-title">User Signals</h3>
              <span v-if="hasUserInsights" class="block-status">From responses</span>
            </div>
            <div v-if="hasUserInsights" class="block-content block-insights">
              <ul v-if="canvas.userInsights.topPains?.length" class="block-list insights-list">
                <li v-for="p in canvas.userInsights.topPains" :key="p">{{ p }}</li>
              </ul>
              <p v-if="canvas.userInsights.wtp" class="insight-highlight">WTP signal: {{ canvas.userInsights.wtp }} — strong validation signal</p>
              <p v-if="canvas.userInsights.retentionHint" class="insight-line">{{ canvas.userInsights.retentionHint }}</p>
              <div class="block-actions">
                <router-link v-if="projectId" :to="`/projects/${projectId}/responses`" class="btn btn-ghost btn-sm">See supporting quotes</router-link>
                <router-link v-if="projectId" :to="`/projects/${projectId}/responses`" class="btn btn-secondary btn-sm">Analyze responses</router-link>
              </div>
            </div>
            <div v-else class="block-empty">
              <p>No user insights yet.</p>
              <p class="block-hint">Launch validation and collect responses to see early signals and metrics.</p>
              <router-link v-if="projectId" :to="`/projects/${projectId}/responses`" class="btn btn-secondary btn-sm">Analyze responses</router-link>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. AI RESEARCH CO-PILOT -->
      <section class="section assistant-section">
        <div class="card assistant-card">
          <div class="card-head">
            <span class="card-icon assistant-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </span>
            <h2 class="card-title">AI Research Co-pilot</h2>
          </div>
          <p class="assistant-intro">Ask any question about your research.</p>
          <div class="chat-examples">
            <span class="chat-examples-label">Example questions:</span>
            <button
              v-for="q in exampleQuestions"
              :key="q"
              type="button"
              class="chat-example-chip"
              @click="assistantInput = q; $nextTick(() => sendAssistantMessage())"
            >
              {{ q }}
            </button>
          </div>
          <div class="chat-wrap">
            <div ref="messagesEl" class="chat-messages">
              <template v-if="!assistantMessages.length">
                <div class="chat-placeholder">
                  <p>E.g. “How to validate this hypothesis?”, “What questions to ask?”, “How many responses for significance?”</p>
                </div>
              </template>
              <div
                v-for="(msg, i) in assistantMessages"
                :key="i"
                class="chat-msg"
                :class="msg.role"
              >
                <span class="chat-msg-label">{{ msg.role === 'user' ? 'You' : 'Co-pilot' }}</span>
                <div class="chat-msg-body">
                  <p class="chat-msg-text">{{ msg.content }}</p>
                  <ul v-if="msg.suggestedMethods?.length" class="chat-msg-list">
                    <li v-for="m in msg.suggestedMethods" :key="m">{{ m }}</li>
                  </ul>
                  <ul v-if="msg.clarificationQuestions?.length" class="chat-msg-list chat-msg-questions">
                    <li v-for="q in msg.clarificationQuestions" :key="q">{{ q }}</li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="chat-input-row">
              <input
                v-model="assistantInput"
                type="text"
                class="chat-input"
                placeholder="Ask about methods, sample size, or how to interpret data…"
                :disabled="assistantLoading"
                @keydown.enter.prevent="sendAssistantMessage"
              />
              <button
                type="button"
                class="btn btn-primary btn-send"
                :disabled="assistantLoading || !assistantInput.trim() || !projectId"
                @click="sendAssistantMessage"
                aria-label="Send message"
              >
                <span v-if="assistantLoading" class="btn-spinner" aria-hidden="true"></span>
                <span v-else class="send-icon" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. NEXT STEPS -->
      <section class="section next-steps-section">
        <div class="card next-steps-card">
          <h2 class="card-title">Next steps</h2>
          <ol class="next-steps-list">
            <li>Run a quick validation (2–3 days)</li>
            <li>Research competitors (1 day)</li>
            <li>Analyze the first 20 responses</li>
            <li>Decide on MVP</li>
          </ol>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Research Assistant page: hypothesis-based block, optional market data collection,
 * synthesis report, AI chat, and canvas blocks (Market Data, Competitors, User Insights).
 */
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../../../../shared/components/PageHeader.vue';
import { API_CONFIG } from '../../../../infrastructure/config/api.config';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES as ROOT_TYPES } from '../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../infrastructure/http/ports/http-client.port';

const route = useRoute();
const projectId = computed(() => route.params.projectId as string);

const recommendedTemplate = ref<{ name: string; slug: string; description: string } | null>(null);
const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);

const loading = ref(true);
const error = ref<string | null>(null);
const canvas = ref<{
  projectId: string;
  marketData: { size?: string; growth?: string; trends?: string[] };
  competitorInfo: { competitors?: string[]; priceRange?: string; rating?: string };
  userInsights: { topPains?: string[]; wtp?: string; retentionHint?: string };
  autocompleteInsights?: {
    searchPhrases: string[];
    results: ReadonlyArray<{ phrase: string; suggestions: string[] }>;
  } | null;
} | null>(null);
const projectName = ref<string>('');
const synthesisLoading = ref(false);
const synthesisError = ref<string | null>(null);
const synthesisReport = ref<{ summary: string; recommendations: string[] } | null>(null);
const collectLoading = ref(false);
const collectError = ref<string | null>(null);
const collectGeography = ref('');
const collectSegment = ref('');
const assistantInput = ref('');
const assistantLoading = ref(false);
const assistantMessages = ref<Array<{
  role: 'user' | 'assistant';
  content: string;
  suggestedMethods?: string[];
  clarificationQuestions?: string[];
}>>([]);
const messagesEl = ref<HTMLElement | null>(null);

const breadcrumbs = computed(() => {
  if (!projectId.value || !projectName.value) return undefined;
  return [
    { label: 'Projects', path: '/projects' },
    { label: projectName.value, path: `/projects/${projectId.value}` },
    { label: 'Research' },
  ];
});

const hasMarketData = computed(() => {
  const m = canvas.value?.marketData;
  return !!(m && (m.size || m.growth || (m.trends && m.trends.length)));
});
const hasCompetitorData = computed(() => {
  const c = canvas.value?.competitorInfo;
  return !!(c && (c.competitors?.length || c.priceRange || c.rating));
});
const hasUserInsights = computed(() => {
  const u = canvas.value?.userInsights;
  return !!(u && (u.topPains?.length || u.wtp || u.retentionHint));
});
const hasAutocompleteInsights = computed(() => {
  const a = canvas.value?.autocompleteInsights;
  return !!(a && a.results?.length && a.results.some((r) => r.suggestions?.length));
});
const marketInsightText = computed(() => {
  if (!canvas.value?.marketData?.growth) return '';
  const g = canvas.value.marketData.growth;
  if (/\d+\s*%/.test(g)) return `Recommend validating demand in your segment.`;
  return '';
});

const exampleQuestions = [
  'How to best validate this hypothesis?',
  'What questions should I ask in the survey?',
  'How many responses do I need for statistical significance?',
  'How to interpret the competitor data?',
];

function scrollChatToBottom() {
  requestAnimationFrame(() => {
    if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  });
}

function useExampleQuestion(q: string) {
  assistantInput.value = q;
  nextTick(() => sendAssistantMessage());
}

async function sendAssistantMessage() {
  const text = assistantInput.value.trim();
  if (!text || !projectId.value) return;
  assistantMessages.value.push({ role: 'user', content: text });
  assistantInput.value = '';
  assistantLoading.value = true;
  scrollChatToBottom();
  try {
    const url = API_CONFIG.ENDPOINTS.RESEARCH_ASSISTANT(projectId.value);
    const data = await httpClient.post<{ reply: string; suggestedMethods?: string[]; clarificationQuestions?: string[] }>(url, { message: text });
    const replyText = data?.reply?.trim();
    if (!replyText) {
      assistantMessages.value.push({
        role: 'assistant',
        content: 'Assistant returned no reply. Please try again.',
      });
    } else {
      assistantMessages.value.push({
        role: 'assistant',
        content: replyText,
        suggestedMethods: data?.suggestedMethods,
        clarificationQuestions: data?.clarificationQuestions,
      });
    }
  } catch (e) {
    assistantMessages.value.push({
      role: 'assistant',
      content: e instanceof Error ? e.message : 'Failed to get reply',
    });
  } finally {
    assistantLoading.value = false;
    scrollChatToBottom();
  }
}

async function collectData() {
  if (!projectId.value) return;
  collectLoading.value = true;
  collectError.value = null;
  synthesisError.value = null;
  try {
    const url = API_CONFIG.ENDPOINTS.RESEARCH_COLLECT(projectId.value);
    const body: { geography?: string; segment?: string; productDescription?: string } = {};
    if (collectGeography.value.trim()) body.geography = collectGeography.value.trim();
    if (collectSegment.value.trim()) body.segment = collectSegment.value.trim();
    await httpClient.post(url, body);
    await loadCanvas();
    await generateSynthesis();
  } catch (e) {
    collectError.value = e instanceof Error ? e.message : 'Failed to collect data';
  } finally {
    collectLoading.value = false;
  }
}

/** Entry point: Research market with AI (collect + auto synthesis). */
function startResearchMarket() {
  collectData();
}

async function generateSynthesis() {
  if (!projectId.value) return;
  synthesisLoading.value = true;
  synthesisError.value = null;
  try {
    const url = API_CONFIG.ENDPOINTS.RESEARCH_SYNTHESIS(projectId.value);
    const data = await httpClient.post<{ report: { summary: string; recommendations: string[] } | string }>(url, {});
    if (data?.report) {
      const raw = data.report;
      const normalize = (r: { summary?: string; recommendations?: string[] }): { summary: string; recommendations: string[] } => {
        let summary = typeof r.summary === 'string' ? r.summary : '';
        if (summary.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(summary) as { summary?: string; recommendations?: string[] };
            summary = typeof parsed.summary === 'string' ? parsed.summary : summary.slice(0, 500);
            const recs = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
            if (recs.length) {
              return { summary, recommendations: recs };
            }
          } catch {
            summary = summary.slice(0, 500);
          }
        }
        return {
          summary,
          recommendations: Array.isArray(r.recommendations) ? r.recommendations : [],
        };
      };
      synthesisReport.value =
        typeof raw === 'string'
          ? (() => {
              try {
                return normalize(JSON.parse(raw) as { summary?: string; recommendations?: string[] });
              } catch {
                return { summary: raw.slice(0, 500), recommendations: [] };
              }
            })()
          : normalize(raw);
    }
  } catch (e) {
    synthesisError.value = e instanceof Error ? e.message : 'Failed to generate synthesis';
  } finally {
    synthesisLoading.value = false;
  }
}

async function loadCanvas() {
  if (!projectId.value) return;
  loading.value = true;
  error.value = null;
  try {
    const url = API_CONFIG.ENDPOINTS.RESEARCH_CANVAS(projectId.value);
    const data = await httpClient.get<{
      canvas: typeof canvas.value;
      projectName?: string;
      recommendedTemplate?: { name: string; slug: string; description: string };
    }>(url);
    if (data?.canvas) canvas.value = data.canvas;
    if (data?.projectName) projectName.value = data.projectName;
    recommendedTemplate.value = data?.recommendedTemplate ?? null;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load research canvas';
  } finally {
    loading.value = false;
  }
}

watch(assistantMessages, () => scrollChatToBottom(), { flush: 'post' });

onMounted(() => {
  loadCanvas();
});
</script>

<style scoped>
.research-canvas-view {
  max-width: 960px;
  margin: 0 auto;
  padding-bottom: var(--space-12, 3rem);
}

/* Header actions: buttons in PageHeader slot (need :deep to target slot container) */
.research-canvas-view :deep(.header-actions .btn),
.research-canvas-view :deep(.header-actions a.btn) {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-sm, 0.5rem);
  font-weight: 500;
  font-size: var(--text-base, 0.875rem);
  cursor: pointer;
  border: none;
  text-decoration: none;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}
.research-canvas-view :deep(.header-actions .btn:disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}
.research-canvas-view :deep(.header-actions .btn-primary),
.research-canvas-view :deep(.header-actions a.btn-primary) {
  background: var(--color-accent);
  color: #fff;
  box-shadow: 0 1px 2px rgba(13, 148, 136, 0.25);
}
.research-canvas-view :deep(.header-actions .btn-primary:hover:not(:disabled)),
.research-canvas-view :deep(.header-actions a.btn-primary:hover) {
  background: var(--color-accent-hover);
  box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);
}
.research-canvas-view :deep(.header-actions .btn-secondary),
.research-canvas-view :deep(.header-actions a.btn-secondary) {
  background: var(--color-bg-subtle, #f1f5f9);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}
.research-canvas-view :deep(.header-actions .btn-secondary:hover:not(:disabled)),
.research-canvas-view :deep(.header-actions a.btn-secondary:hover) {
  background: var(--color-border-light);
  border-color: var(--color-border);
}
.research-canvas-view :deep(.header-actions .btn-ghost),
.research-canvas-view :deep(.header-actions a.btn-ghost) {
  background: transparent;
  color: var(--color-text-muted);
}
.research-canvas-view :deep(.header-actions .btn-ghost:hover:not(:disabled)),
.research-canvas-view :deep(.header-actions a.btn-ghost:hover) {
  color: var(--color-text);
  background: var(--color-bg-subtle);
}

.btn-back {
  margin-right: auto;
}
.btn-icon {
  margin-right: 0.25rem;
}
.btn-spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: -0.15em;
  margin-right: 0.35rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.state {
  text-align: center;
  padding: var(--space-12, 3rem) var(--space-6, 1.5rem);
}
.state-loading p,
.state-error p {
  margin: var(--space-3, 0.75rem) 0 0;
  color: var(--color-text-muted);
  font-size: var(--text-base, 0.875rem);
}
.loading-dots {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}
.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-accent);
  animation: bounce 1.4s ease-in-out infinite both;
}
.loading-dots span:nth-child(1) { animation-delay: 0s; }
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}
.state-error .state-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--color-error-bg);
  color: var(--color-error);
  font-weight: 700;
}
.error-text {
  color: var(--color-error);
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6, 1.5rem);
}
.collect-options-section {
  margin: 0;
}
.collect-options-label {
  font-size: var(--text-sm, 0.8125rem);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2, 0.5rem);
}
.collect-options-row {
  display: flex;
  gap: var(--space-3, 0.75rem);
  flex-wrap: wrap;
}
.collect-option-input {
  flex: 1;
  min-width: 140px;
  max-width: 220px;
  padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 0.5rem);
  font-size: var(--text-base, 0.875rem);
  font-family: inherit;
  background: var(--color-bg);
  color: var(--color-text);
}
.collect-option-input::placeholder {
  color: var(--color-text-subtle);
}
.alerts {
  display: flex;
  flex-direction: column;
  gap: var(--space-2, 0.5rem);
}
.alert {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-radius: var(--radius-sm, 0.5rem);
  font-size: var(--text-sm, 0.8125rem);
}
.alert-error {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid rgba(220, 38, 38, 0.2);
}

.section {
  margin: 0;
}
.section-heading {
  font-size: var(--text-lg, 1.125rem);
  font-weight: 600;
  margin: 0 0 var(--space-3, 0.75rem);
  color: var(--color-text);
}

/* Collect progress (during Research market with AI) */
.collect-progress-card {
  border-color: var(--color-accent);
  background: rgba(13, 148, 136, 0.04);
}
.collect-progress-title {
  margin: 0 0 var(--space-3, 0.75rem);
  font-weight: 600;
  color: var(--color-text);
}
.collect-progress-steps {
  margin: 0 0 var(--space-2, 0.5rem);
  padding-left: 1.25rem;
  list-style: none;
}
.collect-progress-steps li {
  position: relative;
  margin-bottom: 0.35rem;
  font-size: var(--text-base, 0.875rem);
  color: var(--color-text);
}
.step-check {
  position: absolute;
  left: -1.25rem;
  color: var(--color-accent);
  font-weight: 700;
}
.collect-progress-eta {
  margin: 0;
  font-size: var(--text-sm, 0.8125rem);
  color: var(--color-text-muted);
}

/* Quick Start */
.quick-start-section {
  margin-bottom: 0;
}
.quick-start-card .card-title {
  margin-bottom: 0.35rem;
}
.quick-start-intro {
  margin: 0 0 0.75rem;
  font-size: var(--text-base, 0.9375rem);
  color: var(--color-text);
}
.quick-start-list {
  margin: 0 0 1rem;
  padding-left: 1.25rem;
  font-size: var(--text-base, 0.875rem);
  line-height: 1.6;
  color: var(--color-text);
}
.quick-start-list li {
  margin-bottom: 0.25rem;
}
.btn-cta {
  display: inline-block;
  margin-top: 0.25rem;
}
.collect-optional {
  opacity: 0.95;
}

/* Synthesis badge */
.synthesis-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  font-size: var(--text-xs, 0.75rem);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-accent);
  background: rgba(13, 148, 136, 0.1);
  border-radius: var(--radius-sm, 0.5rem);
  margin-right: 0.5rem;
}

.card {
  background: var(--color-bg);
  border-radius: var(--radius-lg, 0.75rem);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  padding: var(--space-6, 1.5rem);
  transition: box-shadow 0.2s, border-color 0.2s;
}
.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
}
.card-head {
  display: flex;
  align-items: center;
  gap: var(--space-3, 0.75rem);
  margin-bottom: var(--space-4, 1rem);
}
.card-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius-sm);
}
.card-title {
  font-size: var(--text-lg, 1.125rem);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  letter-spacing: -0.01em;
}
.synthesis-icon { background: rgba(139, 92, 246, 0.12); color: #7c3aed; }
.assistant-icon { background: rgba(13, 148, 136, 0.12); color: var(--color-accent); }

.synthesis-summary {
  margin: 0 0 var(--space-4, 1rem);
  font-size: var(--text-base, 0.875rem);
  line-height: 1.6;
  color: var(--color-text);
}
.synthesis-list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.synthesis-list li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2, 0.5rem);
  margin-bottom: var(--space-2, 0.5rem);
  font-size: var(--text-sm, 0.8125rem);
  color: var(--color-text-muted);
}
.list-bullet {
  flex-shrink: 0;
  width: 0.35rem;
  height: 0.35rem;
  margin-top: 0.5em;
  border-radius: 50%;
  background: #7c3aed;
}

.chat-wrap {
  border-radius: var(--radius-md, 0.625rem);
  background: var(--color-bg-page, #f8fafc);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}
.chat-messages {
  max-height: 380px;
  overflow-y: auto;
  padding: var(--space-4, 1rem);
  display: flex;
  flex-direction: column;
  gap: var(--space-4, 1rem);
}
.chat-placeholder {
  padding: var(--space-6, 1.5rem);
  text-align: center;
  color: var(--color-text-muted);
  font-size: var(--text-sm, 0.8125rem);
}
.chat-msg {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-width: 90%;
}
.chat-msg.user { align-self: flex-end; }
.chat-msg.assistant { align-self: flex-start; }
.chat-msg-label {
  font-size: var(--text-xs, 0.6875rem);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-muted);
}
.chat-msg.user .chat-msg-label { color: var(--color-accent); }
.chat-msg-body {
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border-radius: var(--radius-md);
  font-size: var(--text-sm, 0.8125rem);
  line-height: 1.5;
}
.chat-msg.user .chat-msg-body {
  background: var(--color-accent);
  color: #fff;
}
.chat-msg.assistant .chat-msg-body {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  color: var(--color-text);
}
.chat-msg-text { margin: 0; }
.chat-msg-list {
  margin: var(--space-2, 0.5rem) 0 0;
  padding-left: 1.25rem;
  font-size: var(--text-xs, 0.6875rem);
  opacity: 0.95;
}
.chat-msg-questions { list-style: none; padding-left: 0; }
.chat-msg-questions li::before { content: '? '; font-weight: 600; }
.chat-input-row {
  display: flex;
  gap: var(--space-2, 0.5rem);
  padding: var(--space-3, 0.75rem);
  background: var(--color-bg);
  border-top: 1px solid var(--color-border-light);
}
.chat-input {
  flex: 1;
  padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base, 0.875rem);
  font-family: inherit;
  background: var(--color-bg);
  color: var(--color-text);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.chat-input::placeholder { color: var(--color-text-subtle); }
.chat-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}
.btn-send {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
}
.send-icon { display: inline-flex; }

.blocks-section { margin-top: var(--space-2, 0.5rem); }
.canvas-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-5, 1.25rem);
}
@media (max-width: 700px) {
  .canvas-grid { grid-template-columns: 1fr; }
}
.canvas-block {
  display: flex;
  flex-direction: column;
  min-height: 140px;
}
.block-head {
  display: flex;
  align-items: center;
  gap: var(--space-2, 0.5rem);
  margin-bottom: var(--space-3, 0.75rem);
}
.block-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-sm);
}
.block-title {
  font-size: var(--text-md, 1rem);
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
.block-status {
  margin-left: auto;
  font-size: var(--text-xs, 0.75rem);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.market-icon   { background: rgba(14, 165, 233, 0.12); color: #0284c7; }
.competitor-icon { background: rgba(245, 158, 11, 0.12); color: #b45309; }
.autocomplete-icon { background: rgba(139, 92, 246, 0.12); color: #7c3aed; }
.insights-icon { background: rgba(34, 197, 94, 0.12); color: #059669; }
.autocomplete-phrase-group { margin-bottom: var(--space-3, 0.75rem); }
.autocomplete-phrase-group:last-child { margin-bottom: 0; }
.autocomplete-phrase { margin: 0 0 0.25em 0; font-size: var(--text-sm, 0.8125rem); }
.block-subtitle { font-size: var(--text-xs, 0.75rem); color: var(--color-text-subtle); margin-bottom: var(--space-2, 0.5rem); }

.block-content,
.block-empty {
  font-size: var(--text-sm, 0.8125rem);
  color: var(--color-text-muted);
  line-height: 1.5;
}
.block-content p,
.block-empty p { margin: 0 0 0.35em 0; }
.block-content p:last-child,
.block-empty p:last-child { margin-bottom: 0; }
.block-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.block-list {
  margin: 0.35em 0 0;
  padding-left: 1.25rem;
}
.block-list li { margin: 0.2em 0; }
.block-insights .insights-list { padding-left: 1rem; list-style: disc; }
.insight-highlight {
  margin: 0.5em 0 0;
  font-weight: 600;
  color: var(--color-text);
}
.insight-line { margin: 0.2em 0 0; }
.block-hint {
  margin: 0.35em 0 0;
  font-size: var(--text-xs, 0.75rem);
  color: var(--color-text-subtle);
}
.block-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--space-4, 1rem);
  gap: 0.5rem;
}
.block-empty-icon {
  font-size: 1.5rem;
  opacity: 0.7;
  line-height: 1;
}
.block-empty p {
  color: var(--color-text-subtle);
  font-style: italic;
  margin: 0;
}

/* AI Co-pilot */
.assistant-intro {
  margin: 0 0 var(--space-3, 0.75rem);
  font-size: var(--text-base, 0.875rem);
  color: var(--color-text-muted);
}
.chat-examples {
  margin-bottom: var(--space-4, 1rem);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2, 0.5rem);
}
.chat-examples-label {
  font-size: var(--text-sm, 0.8125rem);
  color: var(--color-text-muted);
  margin: 0;
  flex-basis: 100%;
}
.chat-example-chip {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  font-size: var(--text-sm, 0.8125rem);
  font-family: inherit;
  color: var(--color-accent);
  background: rgba(13, 148, 136, 0.08);
  border: 1px solid rgba(13, 148, 136, 0.25);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}
.chat-example-chip:hover {
  background: rgba(13, 148, 136, 0.14);
  border-color: var(--color-accent);
}

/* Next steps */
.next-steps-section { margin-bottom: 0; }
.next-steps-list {
  margin: 0;
  padding-left: 1.5rem;
  font-size: var(--text-base, 0.875rem);
  line-height: 1.7;
  color: var(--color-text);
}
.next-steps-list li { margin-bottom: 0.35rem; }
</style>
