<template>
  <div class="scraper-view">
    <header class="scraper-hero">
      <router-link
        v-if="projectId"
        :to="`/projects/${projectId}`"
        class="scraper-back"
        aria-label="Back to project"
      >
        <svg class="back-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>Back</span>
      </router-link>
      <div class="scraper-hero-main">
        <div class="scraper-hero-text">
          <h1 class="scraper-title">Data sources</h1>
          <p class="scraper-subtitle">{{ projectName || 'Collect prices, reviews, and trends from the web' }}</p>
        </div>
        <button
          type="button"
          class="scraper-add-btn"
          :disabled="!projectId || viewModel.addLoading.value"
          @click="editSourceId = null; showAddForm = true; loadPresets();"
        >
          <span v-if="viewModel.addLoading.value" class="btn-spinner" aria-hidden="true"></span>
          <svg v-else class="add-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add source
        </button>
      </div>
    </header>

    <div v-if="viewModel.loadError.value" class="alert alert-error" role="alert">
      <span class="alert-icon" aria-hidden="true">!</span>
      <p>{{ viewModel.loadError.value }}</p>
    </div>

    <div v-else class="scraper-content">
      <!-- Key Insights from latest run with insights -->
      <section
        v-if="projectId && latestInsightRun"
        class="key-insights-block"
        aria-labelledby="key-insights-title"
      >
        <h2 id="key-insights-title" class="key-insights-title">Key insights from your data</h2>
        <p v-if="projectName" class="key-insights-hypothesis">
          <span class="key-insights-label">Project:</span> {{ projectName }}
        </p>
        <div class="key-insights-body">
          <div class="key-insights-summary">{{ latestInsightRun.insightsSummary }}</div>
          <p v-if="latestInsightRun.stats" class="key-insights-meta">
            {{ latestInsightRun.stats.urlsSuccess }}/{{ latestInsightRun.stats.urlsTotal }} URLs •
            {{ latestInsightRun.stats.totalItems }} items collected
          </p>
        </div>
      </section>

      <div v-if="projectId" class="metrics-strip">
        <div class="metric">
          <span class="metric-value">{{ viewModel.stats.value.sourcesCount }}</span>
          <span class="metric-label">Sources</span>
        </div>
        <div class="metric">
          <span class="metric-value">{{ viewModel.stats.value.runsCount }}</span>
          <span class="metric-label">Runs</span>
        </div>
        <div class="metric">
          <span class="metric-value">{{ viewModel.stats.value.runsWithInsightsCount }}</span>
          <span class="metric-label">Insights</span>
        </div>
      </div>

      <!-- AI assistant: suggest config -->
      <div v-if="projectId" class="ai-assist">
        <p class="ai-assist-title">Don’t know what to parse? AI will help</p>
        <div class="ai-assist-row">
          <input
            v-model="suggestText"
            type="text"
            class="field-input ai-assist-input"
            placeholder="e.g. I want to track competitor prices weekly"
            @keydown.enter.prevent="runSuggest()"
          />
          <button
            type="button"
            class="btn btn-secondary"
            :disabled="!suggestText.trim() || viewModel.suggestLoading.value"
            @click="runSuggest()"
          >
            <span v-if="viewModel.suggestLoading.value" class="btn-spinner small"></span>
            {{ viewModel.suggestLoading.value ? '…' : 'Suggest' }}
          </button>
        </div>
        <p class="ai-assist-or">or choose a template</p>
        <div class="template-buttons">
          <button
            v-for="t in QUICK_TEMPLATES"
            :key="t.id"
            type="button"
            class="btn btn-template"
            @click="applyTemplate(t)"
          >
            {{ t.label }}
          </button>
        </div>
      </div>

      <div class="scraper-layout">
      <!-- Sources column -->
      <section class="panel sources-panel">
        <div class="panel-head">
          <h2 class="panel-title">Sources</h2>
          <span v-if="viewModel.sources.value.length" class="panel-count">{{ viewModel.sources.value.length }}</span>
        </div>
        <div v-if="viewModel.sources.value.length === 0" class="empty-state">
          <div class="empty-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
              <path d="M16 21h5v-5"/>
            </svg>
          </div>
          <p class="empty-title">No data sources yet</p>
          <p class="empty-desc">Add competitor sites, review pages, or custom URLs to collect data.</p>
          <button type="button" class="btn btn-primary" @click="editSourceId = null; showAddForm = true; loadPresets();">
            <span class="btn-icon">+</span> Add your first source
          </button>
        </div>
        <ul v-else class="sources-grid">
          <li v-for="src in viewModel.sources.value" :key="src.id" class="source-card">
            <div class="source-card-header">
              <span class="source-type-badge" :class="`type-${src.type}`">{{ formatType(src.type) }}</span>
              <span class="source-url-count">{{ src.urls?.length || 0 }} URL{{ (src.urls?.length || 0) !== 1 ? 's' : '' }}</span>
              <div class="source-card-menu-wrap">
                <button
                  type="button"
                  class="btn btn-icon-only source-menu-trigger"
                  aria-label="Source options"
                  aria-haspopup="true"
                  :aria-expanded="sourceMenuOpenId === src.id"
                  @click.stop="sourceMenuOpenId = sourceMenuOpenId === src.id ? null : src.id"
                >
                  <span aria-hidden="true">⋮</span>
                </button>
                <div v-if="sourceMenuOpenId === src.id" class="source-dropdown" role="menu">
                  <button type="button" class="source-dropdown-item" role="menuitem" @click="openEditSource(src)">Edit</button>
                  <button type="button" class="source-dropdown-item source-dropdown-item-danger" role="menuitem" @click="deleteSource(src)">Delete</button>
                </div>
              </div>
            </div>
            <p v-if="src.name" class="source-name">{{ src.name }}</p>
            <p v-else class="source-collect">{{ (src.whatToCollect || []).slice(0, 2).join(', ') || 'Data' }}</p>
            <p v-if="src.urls?.length && src.urls[0]" class="source-first-url" :title="src.urls[0]">{{ truncateUrl(src.urls[0]) }}</p>
            <p v-if="src.researchGoal && presetLabel(src.researchGoal)" class="source-connected">
              <span class="source-connected-label">Linked to hypothesis:</span> {{ presetLabel(src.researchGoal) }}
            </p>
            <p v-if="lastRunForSource(src.id)" class="source-last-run">
              <span class="source-last-run-dot" :class="lastRunForSource(src.id)?.status" aria-hidden="true"></span>
              Last run: {{ lastRunLabel(src.id) }}
            </p>
            <div class="source-card-actions">
              <button
                type="button"
                class="btn btn-run"
                :disabled="viewModel.runLoading.value === src.id"
                :aria-busy="viewModel.runLoading.value === src.id"
                @click="runSource(src.id)"
              >
                <span v-if="viewModel.runLoading.value === src.id" class="btn-spinner small" aria-hidden="true"></span>
                <span v-else class="run-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </span>
                {{ viewModel.runLoading.value === src.id ? 'Running…' : 'Run now' }}
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Results column -->
      <section class="panel results-panel">
        <div class="panel-head">
          <h2 class="panel-title">Data Insights</h2>
        </div>
        <div v-if="viewModel.runs.value.length === 0" class="empty-state empty-state-sm">
          <div class="empty-icon sm" aria-hidden="true">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
          </div>
          <p class="empty-desc">No runs yet. Add a source and click «Run now».</p>
        </div>
        <ul v-else class="runs-list">
          <li v-for="run in viewModel.runs.value" :key="run.id" class="run-card">
            <div class="run-card-header">
              <span class="status-badge" :class="run.status">{{ run.status }}</span>
              <time class="run-time" :datetime="run.completedAt || run.startedAt || run.createdAt || ''">{{ formatDate(run.completedAt || run.startedAt || run.createdAt) }}</time>
            </div>
            <p v-if="run.stats && run.status !== 'failed'" class="run-stats-preview">
              {{ run.stats.urlsSuccess }}/{{ run.stats.urlsTotal }} URLs • {{ run.stats.totalItems }} items
            </p>
            <p v-if="run.errorMessage" class="run-error">{{ run.errorMessage }}</p>
            <template v-else>
              <div v-if="run.insightsSummary" class="run-insights">
                <h4 class="run-insights-title">Research insights</h4>
                <div class="run-insights-body">{{ run.insightsSummary }}</div>
              </div>
              <div v-else-if="run.status === 'completed' && run.rawResult" class="run-actions">
                <button
                  type="button"
                  class="btn btn-run"
                  :disabled="viewModel.insightsLoading.value === run.id"
                  @click="generateInsights(run.id)"
                >
                  <span v-if="viewModel.insightsLoading.value === run.id" class="btn-spinner small"></span>
                  {{ viewModel.insightsLoading.value === run.id ? 'Generating…' : 'Generate insights' }}
                </button>
              </div>
              <details v-if="run.rawResult" class="run-details" :open="expandedRawRunId === run.id">
                <summary @click.prevent="expandedRawRunId = expandedRawRunId === run.id ? null : run.id">What was collected</summary>
                <div class="run-summary">
                  <template v-for="(entry, idx) in formatRunSummary(run)" :key="idx">
                    <p class="run-summary-url">{{ entry.url }}</p>
                    <p v-if="entry.error" class="run-summary-error">{{ entry.error }}</p>
                    <ul v-else class="run-summary-list">
                      <li v-for="(line, i) in entry.lines" :key="i">{{ line }}</li>
                    </ul>
                  </template>
                </div>
              </details>
            </template>
          </li>
        </ul>
      </section>
      </div>
    </div>

    <!-- Modal: Add / Edit source -->
    <Teleport to="body">
      <div v-if="showAddForm" class="modal-backdrop" @click.self="closeAddOrEditForm">
        <div class="modal" role="dialog" :aria-labelledby="editSourceId ? 'edit-source-title' : 'add-source-title'" aria-modal="true">
          <div class="modal-header">
            <h2 :id="editSourceId ? 'edit-source-title' : 'add-source-title'" class="modal-title">{{ editSourceId ? 'Edit data source' : 'Add data source' }}</h2>
            <button type="button" class="modal-close" aria-label="Close" @click="closeAddOrEditForm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <form id="add-source-form" @submit.prevent="editSourceId ? submitEdit() : submitAdd()" class="modal-body">
            <div class="field">
              <label for="scraper-goal" class="field-label">Link to hypothesis</label>
              <select id="scraper-goal" v-model="addForm.researchGoal" class="field-input" @change="applyPreset(addForm.researchGoal)">
                <option value="">—</option>
                <option v-for="(label, key) in (viewModel.presets.value?.labels ?? {})" :key="key" :value="key">{{ label }}</option>
              </select>
              <span class="field-hint">Preset fills type, what to collect, frequency</span>
            </div>
            <div class="field">
              <label for="scraper-type" class="field-label">Type</label>
              <select id="scraper-type" v-model="addForm.type" class="field-input" required>
                <option value="competitor_sites">Competitor sites (prices, features)</option>
                <option value="user_reviews">User reviews (App Store, Trustpilot)</option>
                <option value="job_market">Job market (LinkedIn, HH.ru)</option>
                <option value="news_articles">News / articles (trends)</option>
                <option value="custom">Custom parsing</option>
              </select>
              <p v-if="viewModel.fieldErrors.value?.customSelectors" class="field-error" role="alert">{{ viewModel.fieldErrors.value.customSelectors }}</p>
            </div>
            <div class="field">
              <label for="scraper-urls" class="field-label">URLs</label>
              <textarea
                id="scraper-urls"
                v-model="addForm.urlsText"
                class="field-input field-textarea"
                rows="4"
                placeholder="https://competitor1.com/pricing&#10;https://competitor2.com"
              />
              <span class="field-hint">One per line or comma-separated</span>
              <p v-if="viewModel.fieldErrors.value?.urls" class="field-error" role="alert">{{ viewModel.fieldErrors.value.urls }}</p>
            </div>
            <div class="field">
              <label for="scraper-collect" class="field-label">What to collect</label>
              <input
                id="scraper-collect"
                v-model="addForm.whatToCollectText"
                type="text"
                class="field-input"
                placeholder="e.g. Prices, descriptions, CTA buttons"
              />
            </div>
            <div class="field">
              <label for="scraper-frequency" class="field-label">Frequency</label>
              <select id="scraper-frequency" v-model="addForm.frequency" class="field-input">
                <option value="once">Once</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </form>
          <div class="modal-footer">
            <button type="button" class="modal-cancel" @click="closeAddOrEditForm">Cancel</button>
            <button type="submit" form="add-source-form" class="modal-submit" :disabled="viewModel.addLoading.value">
              <span v-if="viewModel.addLoading.value" class="btn-spinner" aria-hidden="true"></span>
              {{ viewModel.addLoading.value ? (editSourceId ? 'Saving…' : 'Adding…') : (editSourceId ? 'Save' : 'Add source') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { container } from '../../../../infrastructure/bootstrap/container';
import { TYPES } from '../../infrastructure/bootstrap/types';
import { ScraperViewModel } from '../view-models/scraper.view-model';
import { ScraperPresenter } from '../presenters/scraper.presenter';
import type { ScraperRun } from '../../domain/entities/scraper-run.entity';
import type { ScraperSource } from '../../domain/entities/scraper-source.entity';

const route = useRoute();
const projectId = computed(() => route.params.projectId as string);
const projectName = ref<string>('');

const viewModel = new ScraperViewModel();
const presenter = container.get<ScraperPresenter>(TYPES.ScraperPresenter);

const showAddForm = ref(false);
const suggestText = ref('');
const expandedRawRunId = ref<string | null>(null);
const editSourceId = ref<string | null>(null);
const sourceMenuOpenId = ref<string | null>(null);

const addForm = ref({
  type: 'competitor_sites',
  researchGoal: '' as string,
  urlsText: '',
  whatToCollectText: 'Prices, plans',
  frequency: 'once',
});

/** Latest run that has insightsSummary (for Key Insights block) */
const latestInsightRun = computed<ScraperRun | null>(() => {
  const runs = viewModel.runs.value;
  const withInsights = runs.filter((r) => r.insightsSummary && r.status === 'completed');
  return withInsights[0] ?? null;
});

/** One-click templates: id maps to researchGoal or standalone */
const QUICK_TEMPLATES = [
  { id: 'price_strategy', label: 'Price comparison', researchGoal: 'price_strategy', defaultUrls: 'https://www.notion.so/pricing\nhttps://asana.com/pricing', type: 'competitor_sites', whatToCollect: 'Prices, plan names, features, CTAs', frequency: 'weekly' },
  { id: 'user_pains', label: 'User sentiment', researchGoal: 'user_pains', defaultUrls: '', type: 'user_reviews', whatToCollect: 'Complaints, problems, rating', frequency: 'weekly' },
  { id: 'market_trends', label: 'Market trends', researchGoal: 'market_trends', defaultUrls: '', type: 'news_articles', whatToCollect: 'Trends, forecasts, statistics', frequency: 'daily' },
  { id: 'find_respondents', label: 'Hiring intelligence', researchGoal: 'find_respondents', defaultUrls: '', type: 'job_market', whatToCollect: 'Roles, skills, companies', frequency: 'once' },
];

function applyTemplate(t: (typeof QUICK_TEMPLATES)[0]) {
  addForm.value.type = t.type;
  addForm.value.researchGoal = t.researchGoal;
  addForm.value.urlsText = t.defaultUrls;
  addForm.value.whatToCollectText = t.whatToCollect;
  addForm.value.frequency = t.frequency;
  editSourceId.value = null;
  viewModel.fieldErrors.value = null;
  showAddForm.value = true;
  loadPresets();
}

function presetLabel(researchGoal: string): string {
  return viewModel.presets.value?.labels?.[researchGoal] ?? researchGoal;
}

function openEditSource(src: ScraperSource) {
  sourceMenuOpenId.value = null;
  editSourceId.value = src.id;
  addForm.value.type = src.type;
  addForm.value.researchGoal = (src.researchGoal ?? '') as string;
  addForm.value.urlsText = (src.urls ?? []).join('\n');
  addForm.value.whatToCollectText = (src.whatToCollect ?? []).join(', ');
  addForm.value.frequency = src.frequency ?? 'once';
  showAddForm.value = true;
  loadPresets();
}

function closeAddOrEditForm() {
  showAddForm.value = false;
  editSourceId.value = null;
}

const SOURCE_TYPES: Record<string, string> = {
  competitor_sites: 'Competitor sites',
  user_reviews: 'User reviews',
  job_market: 'Job market',
  news_articles: 'News / articles',
  custom: 'Custom',
};

function formatType(type: string): string {
  return SOURCE_TYPES[type] ?? type;
}

function truncateUrl(url: string, maxLen = 42): string {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    const path = u.pathname === '/' ? '' : u.pathname;
    const full = host + path;
    return full.length <= maxLen ? full : full.slice(0, maxLen - 1) + '…';
  } catch {
    return url.length <= maxLen ? url : url.slice(0, maxLen - 1) + '…';
  }
}

function formatDate(s: string | null | undefined): string {
  if (!s) return '—';
  try {
    const d = new Date(s);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60_000) return 'Just now';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return String(s);
  }
}

/** Latest run for a source (by scraperSourceId). */
function lastRunForSource(sourceId: string): ScraperRun | undefined {
  const runs = viewModel.runs.value.filter((r) => r.scraperSourceId === sourceId);
  if (runs.length === 0) return undefined;
  runs.sort((a, b) => {
    const ta = new Date(a.completedAt || a.startedAt || a.createdAt || 0).getTime();
    const tb = new Date(b.completedAt || b.startedAt || b.createdAt || 0).getTime();
    return tb - ta;
  });
  return runs[0];
}

/** Human-readable last run label for a source card. */
function lastRunLabel(sourceId: string): string {
  const run = lastRunForSource(sourceId);
  if (!run) return '—';
  const timeStr = formatDate(run.completedAt || run.startedAt || run.createdAt);
  if (run.status === 'running' || run.status === 'pending') return timeStr + ' • Running…';
  if (run.status === 'failed') return timeStr + ' • Failed';
  const items = run.stats?.totalItems ?? 0;
  return `${timeStr} • ${items} items`;
}

interface RunSummaryEntry {
  url: string;
  error?: string;
  lines: string[];
}

/** User-friendly label for price tier (backend sends tier1, tier2, tier3). */
function priceTierLabel(tier: string | undefined): string {
  if (!tier) return '';
  const map: Record<string, string> = {
    free: 'Free',
    tier1: 'Starter',
    tier2: 'Standard',
    tier3: 'Premium',
    other: 'Other plan',
  };
  if (map[tier]) return map[tier];
  if (/^tier\d+$/.test(tier)) return 'Paid plan';
  return tier;
}

function formatRunSummary(run: ScraperRun): RunSummaryEntry[] {
  const r = run.rawResult?.results;
  if (!r?.length) return [];
  return r.map((x) => {
    if ('error' in x && x.error) {
      return { url: x.url, error: x.error, lines: [] };
    }
    const data = (x as { data?: { type?: string; items?: unknown[] } }).data;
    const items = Array.isArray(data?.items) ? data.items : [];
    const type = (data?.type as string) || '';

    if (type === 'competitor_sites') {
      const lines = items.slice(0, 20).map((it: unknown) => {
        const i = it as { plan?: string; price?: string; priceTier?: string };
        const plan = i.plan || priceTierLabel(i.priceTier) || 'Plan';
        const price = i.price ?? '—';
        return `${plan}: ${price}`;
      });
      if (items.length > 20) lines.push(`… and ${items.length - 20} more`);
      return { url: x.url, lines: lines.length ? lines : ['No plans found'] };
    }

    if (type === 'user_reviews') {
      const lines = items.slice(0, 5).map((it: unknown, idx: number) => {
        const i = it as { text?: string; rating?: number };
        const snippet = typeof i.text === 'string' ? i.text.slice(0, 80) + (i.text.length > 80 ? '…' : '') : '—';
        return i.rating != null ? `${idx + 1}. (${i.rating}/5) ${snippet}` : `${idx + 1}. ${snippet}`;
      });
      if (items.length > 5) lines.push(`… and ${items.length - 5} more reviews`);
      return { url: x.url, lines: lines.length ? [`${items.length} reviews`, ...lines] : ['No reviews found'] };
    }

    if (type === 'job_market' || type === 'news_articles') {
      const lines = items.slice(0, 8).map((it: unknown) => {
        const i = it as { title?: string; snippet?: string };
        return i.title || i.snippet || '—';
      });
      if (items.length > 8) lines.push(`… and ${items.length - 8} more`);
      return { url: x.url, lines: lines.length ? lines : ['No items found'] };
    }

    return {
      url: x.url,
      lines: items.length ? [`${items.length} items collected`] : ['No items collected'],
    };
  });
}

function parseUrls(text: string): string[] {
  return text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function loadSources() {
  if (!projectId.value) return;
  viewModel.loadError.value = null;
  try {
    viewModel.sources.value = await presenter.listSources(projectId.value);
  } catch (e) {
    viewModel.loadError.value = e instanceof Error ? e.message : 'Failed to load sources';
  }
}

async function loadStats() {
  if (!projectId.value) return;
  try {
    viewModel.stats.value = await presenter.getStats(projectId.value);
  } catch {
    // ignore
  }
}

async function loadPresets() {
  if (!projectId.value) return;
  viewModel.presets.value = await presenter.getPresets(projectId.value);
}

function applyPreset(goal: string) {
  const p = viewModel.presets.value?.presets?.[goal];
  if (!p) return;
  addForm.value.type = p.type;
  addForm.value.whatToCollectText = p.whatToCollect?.join(', ') ?? '';
  addForm.value.frequency = p.frequency;
}

async function runSuggest() {
  if (!projectId.value || !suggestText.value.trim()) return;
  viewModel.suggestLoading.value = true;
  viewModel.loadError.value = null;
  try {
    const s = await presenter.suggest(projectId.value, suggestText.value.trim(), projectName.value ? { name: projectName.value } : undefined);
    addForm.value.type = s.type ?? addForm.value.type;
    addForm.value.whatToCollectText = (s.whatToCollect ?? []).join(', ');
    addForm.value.frequency = s.frequency ?? addForm.value.frequency;
    if (s.researchGoal != null) addForm.value.researchGoal = s.researchGoal;
    if (s.urls?.length) addForm.value.urlsText = s.urls.join('\n');
    viewModel.fieldErrors.value = null;
    showAddForm.value = true;
  } catch (e) {
    viewModel.loadError.value = e instanceof Error ? e.message : 'AI suggest failed';
  } finally {
    viewModel.suggestLoading.value = false;
  }
}

async function generateInsights(runId: string) {
  if (!projectId.value) return;
  viewModel.insightsLoading.value = runId;
  viewModel.loadError.value = null;
  try {
    const run = await presenter.generateInsights(projectId.value, runId);
    const idx = viewModel.runs.value.findIndex((r) => r.id === runId);
    if (idx >= 0) viewModel.runs.value[idx] = run;
    await loadStats();
  } catch (e) {
    viewModel.loadError.value = e instanceof Error ? e.message : 'Generate insights failed';
  } finally {
    viewModel.insightsLoading.value = null;
  }
}

async function loadResults() {
  if (!projectId.value) return;
  try {
    viewModel.runs.value = await presenter.getResults(projectId.value);
  } catch {
    viewModel.runs.value = [];
  }
}

/** Parses HTTP 400 body from error message and sets loadError + fieldErrors for form validation. */
function setFormErrorFromResponse(e: unknown, fallbackMessage: string): void {
  viewModel.fieldErrors.value = null;
  const msg = e instanceof Error ? e.message : String(e);
  if (msg.startsWith('HTTP 400: ')) {
    try {
      const body = JSON.parse(msg.slice('HTTP 400: '.length)) as { error?: string; fields?: Record<string, string> };
      const error = body.error ?? 'Validation failed';
      const fields = body.fields && typeof body.fields === 'object' ? body.fields : undefined;
      viewModel.fieldErrors.value = fields ?? null;
      const firstField = fields && Object.keys(fields).length ? Object.values(fields)[0] : null;
      viewModel.loadError.value = firstField ? `${error}. ${firstField}` : error;
      return;
    } catch {
      // fall through to raw message
    }
  }
  viewModel.loadError.value = msg || fallbackMessage;
}

async function submitAdd() {
  if (!projectId.value) return;
  const urls = parseUrls(addForm.value.urlsText);
  if (urls.length === 0) {
    viewModel.loadError.value = 'Enter at least one URL';
    return;
  }
  viewModel.addLoading.value = true;
  viewModel.loadError.value = null;
  viewModel.fieldErrors.value = null;
  try {
    await presenter.addSource(projectId.value, {
      type: addForm.value.type,
      researchGoal: addForm.value.researchGoal || undefined,
      urls,
      whatToCollect: addForm.value.whatToCollectText
        ? addForm.value.whatToCollectText.split(',').map((s) => s.trim()).filter(Boolean)
        : ['data'],
      frequency: addForm.value.frequency,
    });
    closeAddOrEditForm();
    addForm.value.urlsText = '';
    await loadSources();
    await loadStats();
  } catch (e) {
    setFormErrorFromResponse(e, 'Failed to add source');
  } finally {
    viewModel.addLoading.value = false;
  }
}

async function submitEdit() {
  const id = editSourceId.value;
  if (!projectId.value || !id) return;
  const urls = parseUrls(addForm.value.urlsText);
  if (urls.length === 0) {
    viewModel.loadError.value = 'Enter at least one URL';
    viewModel.fieldErrors.value = { urls: 'Enter at least one URL' };
    return;
  }
  viewModel.addLoading.value = true;
  viewModel.loadError.value = null;
  viewModel.fieldErrors.value = null;
  try {
    await presenter.updateSource(projectId.value, id, {
      type: addForm.value.type,
      researchGoal: addForm.value.researchGoal || undefined,
      urls,
      whatToCollect: addForm.value.whatToCollectText
        ? addForm.value.whatToCollectText.split(',').map((s) => s.trim()).filter(Boolean)
        : ['data'],
      frequency: addForm.value.frequency,
    });
    closeAddOrEditForm();
    await loadSources();
  } catch (e) {
    setFormErrorFromResponse(e, 'Failed to update source');
  } finally {
    viewModel.addLoading.value = false;
  }
}

async function runSource(sourceId: string) {
  if (!projectId.value) return;
  viewModel.runLoading.value = sourceId;
  try {
    await presenter.runScraper(projectId.value, sourceId);
    await loadResults();
    await loadStats();
  } catch (e) {
    viewModel.loadError.value = e instanceof Error ? e.message : 'Run failed';
  } finally {
    viewModel.runLoading.value = null;
  }
}

async function deleteSource(src: { id: string }) {
  if (!projectId.value) return;
  if (!confirm('Delete this data source? Past runs will remain in history.')) return;
  sourceMenuOpenId.value = null;
  viewModel.loadError.value = null;
  try {
    await presenter.deleteSource(projectId.value, src.id);
    await loadSources();
    await loadResults();
    await loadStats();
  } catch (e) {
    viewModel.loadError.value = e instanceof Error ? e.message : 'Failed to delete source';
  }
}

onMounted(() => {
  loadSources();
  loadResults();
  loadStats();
  loadPresets();
});

watch(projectId, () => {
  loadSources();
  loadResults();
  loadStats();
  loadPresets();
});

watch(sourceMenuOpenId, (id) => {
  if (!id) return;
  const close = () => {
    sourceMenuOpenId.value = null;
    document.removeEventListener('click', close);
  };
  setTimeout(() => document.addEventListener('click', close), 0);
});
</script>

<style scoped>
.scraper-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-12);
  min-height: 100vh;
}

/* ─── Hero ───────────────────────────────────────────────────── */
.scraper-hero {
  margin-bottom: var(--space-8);
  padding-bottom: var(--space-6);
}

.scraper-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  margin-bottom: var(--space-5);
  padding: 0.35rem 0;
  border-radius: var(--radius-md);
  transition: color 0.2s, background 0.2s;
}
.scraper-back:hover {
  color: var(--color-accent);
  background: var(--color-accent-light);
}
.back-arrow {
  flex-shrink: 0;
  opacity: 0.8;
}

.scraper-hero-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-6);
  flex-wrap: wrap;
}
.scraper-hero-text {
  min-width: 0;
}
.scraper-title {
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text);
  margin: 0 0 var(--space-2);
  line-height: 1.15;
}
.scraper-subtitle {
  font-size: var(--text-md);
  color: var(--color-text-muted);
  margin: 0;
  line-height: 1.5;
}

.scraper-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  color: #fff;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.35);
  transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
}
.scraper-add-btn:hover:not(:disabled) {
  background: var(--color-accent-dark, #0d9488);
  box-shadow: 0 4px 14px rgba(13, 148, 136, 0.4);
  transform: translateY(-1px);
}
.scraper-add-btn:active:not(:disabled) {
  transform: translateY(0);
}
.scraper-add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.add-icon {
  flex-shrink: 0;
}

.scraper-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

/* ─── Metrics ─────────────────────────────────────────────────── */
.metrics-strip {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
}
.metric {
  flex: 1;
  min-width: 100px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: var(--space-5) var(--space-6);
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s;
}
.metric:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-border);
  transform: translateY(-2px);
}
.metric-value {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-text);
  line-height: 1.1;
}
.metric-label {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ─── Key Insights ────────────────────────────────────────────── */
.key-insights-block {
  padding: var(--space-6) var(--space-7);
  background: linear-gradient(145deg, rgba(204, 251, 241, 0.6) 0%, rgba(248, 250, 252, 0.95) 100%);
  border-radius: var(--radius-xl);
  border-left: 4px solid var(--color-accent);
  box-shadow: var(--shadow-sm);
}
.key-insights-title {
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent-dark);
  margin: 0 0 var(--space-2);
}
.key-insights-hypothesis {
  font-size: var(--text-sm);
  color: var(--color-text);
  margin: 0 0 var(--space-3);
}
.key-insights-label {
  font-weight: 600;
  color: var(--color-text-muted);
}
.key-insights-body {
  margin-top: var(--space-2);
}
.key-insights-summary {
  font-size: var(--text-md);
  line-height: 1.65;
  color: var(--color-text);
  white-space: pre-wrap;
}
.key-insights-meta {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: var(--space-3) 0 0;
}

/* ─── AI Assist ────────────────────────────────────────────────── */
.ai-assist {
  padding: var(--space-6);
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
}
.ai-assist-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 var(--space-4);
}
.ai-assist-row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}
.ai-assist-input {
  flex: 1;
  min-width: 0;
  border-radius: var(--radius-lg);
  padding: 0.65rem 1rem;
  border: 1px solid var(--color-border);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.ai-assist-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.12);
}
.ai-assist-or {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: var(--space-4) 0 var(--space-2);
}
.template-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.btn-template {
  padding: 0.5rem 1rem;
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.15s;
}
.btn-template:hover {
  background: var(--color-accent-light);
  color: var(--color-accent-dark);
  border-color: rgba(13, 148, 136, 0.2);
  transform: translateY(-1px);
}
.btn-secondary {
  flex-shrink: 0;
  padding: 0.65rem 1.25rem;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, border-color 0.2s, color 0.2s;
}
.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-subtle);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.run-insights {
  margin-top: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-light);
}
.run-insights-title {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.run-insights-body {
  font-size: var(--text-sm);
  line-height: 1.55;
  color: var(--color-text);
  white-space: pre-wrap;
}
.run-actions {
  margin-top: var(--space-3);
}

.scraper-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-6);
  align-items: start;
}

@media (max-width: 768px) {
  .scraper-layout {
    grid-template-columns: 1fr;
  }
}

/* Alert */
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
}
.alert-error {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid rgba(220, 38, 38, 0.2);
}
.alert-icon {
  flex-shrink: 0;
  font-weight: 700;
}

/* Panels */
.panel {
  background: var(--color-bg);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-light);
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
}
.panel-title {
  font-size: 1.0625rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--color-text);
  margin: 0;
}
.panel-count {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  background: var(--color-bg-subtle);
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}

/* Empty state */
.empty-state {
  padding: var(--space-12) var(--space-6);
  text-align: center;
}
.empty-state-sm {
  padding: var(--space-8);
}
.empty-icon {
  color: var(--color-text-subtle);
  margin-bottom: var(--space-4);
  opacity: 0.7;
}
.empty-icon.sm {
  margin-bottom: var(--space-3);
}
.empty-icon.sm svg {
  width: 32px;
  height: 32px;
}
.empty-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 var(--space-2);
}
.empty-desc {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-6);
  line-height: 1.55;
  max-width: 320px;
  margin-left: auto;
  margin-right: auto;
}
.empty-state-sm .empty-desc {
  margin-bottom: 0;
}

/* Sources grid */
.sources-panel.panel {
  overflow: visible;
}
.sources-panel .panel-head + * {
  padding: var(--space-5);
}
.sources-grid {
  list-style: none;
  padding: var(--space-5);
  margin: 0;
  display: grid;
  gap: var(--space-4);
}
.source-card {
  background: none;
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
  overflow: visible;
}
.source-card:hover {
  border-color: var(--color-border);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.source-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  position: relative;
}
.source-card-menu-wrap {
  position: relative;
  overflow: visible;
}
.source-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  font-size: 1.25rem;
  line-height: 1;
  color: var(--color-text-muted);
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.source-menu-trigger:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
.source-menu-trigger[aria-expanded="true"] {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
.source-dropdown {
  position: absolute;
  bottom: 100%;
  top: auto;
  right: 0;
  margin-bottom: 4px;
  margin-top: 0;
  min-width: 200px;
  max-height: 280px;
  overflow-y: auto;
  padding: var(--space-1);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 50;
}
.source-dropdown-divider {
  height: 1px;
  margin: var(--space-1) 0;
  background: var(--color-border-light);
}
.source-dropdown-item {
  display: block;
  width: 100%;
  padding: 0.55rem 0.85rem;
  font-size: var(--text-sm);
  text-align: left;
  color: var(--color-text);
  background: none;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s;
}
.source-dropdown-item:hover:not(:disabled) {
  background: var(--color-bg-subtle);
}
.source-dropdown-item:disabled {
  color: var(--color-text-subtle);
  cursor: default;
}
.source-dropdown-item-danger {
  color: var(--color-error, #c53030);
}
.source-dropdown-item-danger:hover:not(:disabled) {
  background: rgba(197, 48, 48, 0.08);
}
.source-connected {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2);
  line-height: 1.45;
}
.source-connected-label {
  font-weight: 500;
}
.source-last-run {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-1);
  line-height: 1.4;
}
.source-last-run-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.source-last-run-dot.completed {
  background: var(--color-success, #38a169);
}
.source-last-run-dot.failed {
  background: var(--color-error, #c53030);
}
.source-last-run-dot.running,
.source-last-run-dot.pending {
  background: var(--color-warning, #d69e2e);
  animation: pulse-dot 1.2s ease-in-out infinite;
}
@keyframes pulse-dot {
  50% { opacity: 0.5; }
}
.source-type-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.3rem 0.6rem;
  border-radius: 999px;
}
.type-competitor_sites { background: var(--color-accent-light); color: var(--color-accent-dark); }
.type-user_reviews { background: var(--color-info-bg); color: var(--color-info); }
.type-job_market { background: var(--color-warning-bg); color: var(--color-warning); }
.type-news_articles { background: #f3e8ff; color: #6b21a8; }
.type-custom { background: var(--color-bg-subtle); color: var(--color-text-muted); }
.source-url-count {
  font-size: var(--text-xs);
  font-weight: 500;
  color: var(--color-text-muted);
}
.source-name,
.source-collect {
  font-size: var(--text-sm);
  color: var(--color-text);
  margin: 0 0 var(--space-3);
  line-height: 1.45;
  font-weight: 500;
}
.source-collect {
  color: var(--color-text-muted);
  font-weight: 400;
}
.source-first-url {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 var(--space-3);
  line-height: 1.4;
  word-break: break-all;
}
.source-card-actions {
  margin-top: var(--space-4);
}
.btn-run {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-accent);
  background: var(--color-accent-light);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, color 0.2s, transform 0.15s, box-shadow 0.2s;
}
.btn-run:hover:not(:disabled) {
  background: var(--color-accent);
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.3);
}
.btn-run:active:not(:disabled) {
  transform: translateY(0);
}
.btn-run:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.run-icon {
  display: inline-flex;
}

/* Results panel */
.runs-list {
  list-style: none;
  padding: var(--space-5);
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.run-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-xl);
  padding: var(--space-5);
  font-size: var(--text-sm);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.run-card:hover {
  border-color: var(--color-border);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
.run-card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}
.status-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.3rem 0.55rem;
  border-radius: 999px;
}
.status-badge.completed {
  background: var(--color-success-bg);
  color: var(--color-success);
}
.status-badge.failed {
  background: var(--color-error-bg);
  color: var(--color-error);
}
.status-badge.partially_failed {
  background: var(--color-warning-bg, #fef3c7);
  color: var(--color-warning, #b45309);
}
.status-badge.running,
.status-badge.pending {
  background: var(--color-bg-subtle);
  color: var(--color-text-muted);
}
.run-time {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 500;
}
.run-stats-preview {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin: 0 0 0.35rem;
  font-weight: 500;
}
.run-error {
  color: var(--color-error);
  margin: 0;
  font-size: var(--text-xs);
}
.run-details {
  margin-top: var(--space-3);
  font-size: var(--text-xs);
}
.run-details summary {
  cursor: pointer;
  color: var(--color-accent);
  font-weight: 600;
  padding: 0.25rem 0;
  transition: color 0.15s;
}
.run-details summary:hover {
  color: var(--color-accent-dark);
}
.run-summary {
  margin-top: var(--space-2);
  padding: var(--space-3);
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-light);
}
.run-summary-url {
  font-size: var(--text-xs);
  font-weight: 600;
  color: var(--color-accent);
  margin: 0 0 var(--space-1);
  word-break: break-all;
}
.run-summary-url + .run-summary-url,
.run-summary-url + .run-summary-list,
.run-summary-list + .run-summary-url {
  margin-top: var(--space-3);
}
.run-summary-error {
  color: var(--color-error);
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
}
.run-summary-list {
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-2);
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--color-text);
}
.run-summary-list li {
  padding: 0.15rem 0;
  border-bottom: 1px solid var(--color-border-light);
}
.run-summary-list li:last-child {
  border-bottom: none;
}

/* Modal */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.modal {
  background: var(--color-bg);
  border-radius: 1.25rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--color-border-light);
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s cubic-bezier(0.21, 0.47, 0.32, 0.98);
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-6) var(--space-6);
  border-bottom: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
}
.modal-title {
  font-size: 1.3125rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  margin: 0;
  color: var(--color-text);
}
.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.modal-close:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
}
.modal-body {
  padding: var(--space-6);
  overflow-y: auto;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-6);
  border-top: 1px solid var(--color-border-light);
  background: var(--color-bg-elevated);
}
.modal-cancel {
  padding: 0.6rem 1.25rem;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-muted);
  background: transparent;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.modal-cancel:hover {
  background: var(--color-bg-subtle);
  color: var(--color-text);
  border-color: var(--color-border);
}
.modal-submit {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.5rem;
  font-size: var(--text-sm);
  font-weight: 600;
  color: #fff;
  background: var(--color-accent);
  border: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 2px 8px rgba(13, 148, 136, 0.35);
  transition: background 0.2s, opacity 0.2s, transform 0.15s;
}
.modal-submit:hover:not(:disabled) {
  background: var(--color-accent-dark, #0d9488);
  transform: translateY(-1px);
}
.modal-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Form fields */
.field {
  margin-bottom: var(--space-5);
}
.field:last-child {
  margin-bottom: 0;
}
.field-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: var(--space-2);
}
.field-input {
  width: 100%;
  padding: 0.6rem 1rem;
  font-size: var(--text-base);
  line-height: 1.5;
  color: var(--color-text);
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px rgba(13, 148, 136, 0.15);
}
.field-input::placeholder {
  color: var(--color-text-subtle);
}
.field-textarea {
  min-height: 110px;
  resize: vertical;
  border-radius: var(--radius-lg);
}
.field-hint {
  display: block;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}
.field-error {
  font-size: var(--text-sm);
  color: var(--color-error, #c53030);
  margin-top: var(--space-1);
  margin-bottom: 0;
}

/* Buttons */
.btn-spinner {
  display: inline-block;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  vertical-align: -0.15em;
}
.btn-spinner.small {
  width: 0.875em;
  height: 0.875em;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.btn-icon {
  margin-right: 0.25rem;
}

/* Empty primary button (Add your first source) */
.btn-primary {
  padding: 0.65rem 1.25rem;
  font-size: var(--text-sm);
  font-weight: 600;
  border-radius: var(--radius-lg);
  transition: transform 0.15s, box-shadow 0.2s;
}
.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
}
</style>
