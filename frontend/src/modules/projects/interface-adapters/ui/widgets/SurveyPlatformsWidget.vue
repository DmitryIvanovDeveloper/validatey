<template>
  <div class="survey-platforms-widget">
    <div class="spw-header">
      <h3 class="spw-title">{{ labels.title }}</h3>
      <button
        class="spw-generate-btn"
        @click="generatePlatforms"
        :disabled="loading"
      >
        {{ loading ? labels.generating : labels.generate }}
      </button>
    </div>

    <div v-if="loading" class="spw-loading">
      <div class="spw-loading-dots">
        <span></span><span></span><span></span>
      </div>
      <span>{{ labels.analyzing }}</span>
    </div>

    <div v-else-if="error" class="spw-empty">
      <svg class="spw-empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <p>{{ error }}</p>
    </div>

    <div v-else-if="!platforms || platforms.length === 0" class="spw-empty">
      <svg class="spw-empty-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
      </svg>
      <p>{{ labels.ready }}</p>
      <p class="spw-empty-hint">{{ labels.readyHint }}</p>
    </div>

    <div v-else class="spw-platforms">
      <div
        v-for="platform in platforms"
        :key="platform.platform"
        class="spw-platform-card"
      >
        <div class="spw-platform-header">
          <div class="spw-platform-main">
            <div class="spw-platform-name-row">
              <a
                :href="getPlatformUrl(platform.platform, platform.subplatform)"
                target="_blank"
                rel="noopener noreferrer"
                class="spw-platform-name spw-platform-link"
              >
                {{ platform.platform }}
              </a>
              <template v-if="platform.subplatform">
                <template v-if="getSubplatformLinks(platform.platform, platform.subplatform).length > 0">
                  <a
                    v-for="(link, index) in getSubplatformLinks(platform.platform, platform.subplatform)"
                    :key="index"
                    :href="link.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="spw-platform-sub spw-platform-sub-link"
                  >
                    {{ link.text }}
                  </a>
                </template>
                <span v-else class="spw-platform-sub">{{ platform.subplatform }}</span>
              </template>
            </div>
            <div class="spw-platform-meta">
              <span class="spw-platform-reach">{{ platform.expectedReach }}</span>
              <span class="spw-platform-strategy">{{ platform.postingStrategy }}</span>
            </div>
          </div>
        </div>

        <div class="spw-platform-reason">
          <p>{{ platform.reason }}</p>
        </div>

        <div class="spw-platform-post">
          <div class="spw-post-header">
            <span class="spw-post-label">{{ labels.postLabel }}</span>
            <button
              type="button"
              class="spw-copy-btn"
              :class="{ 'copied': copiedPostIndex === platforms.indexOf(platform) }"
              @click="copyPost(platform.post, $event)"
            >
              {{ copiedPostIndex === platforms.indexOf(platform) ? labels.copied : labels.copy }}
            </button>
          </div>
          <div class="spw-post-content">{{ platform.post }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { container } from '../../../../../infrastructure/bootstrap/container';
import { TYPES as ROOT_TYPES } from '../../../../../infrastructure/bootstrap/types';
import type { HttpClientPort } from '../../../../../infrastructure/http/ports/http-client.port';
import { API_CONFIG } from '../../../../../infrastructure/config/api.config';

const DEFAULT_LABELS = {
  title: 'Survey platforms',
  generate: 'Generate suggestions',
  generating: 'Generating…',
  analyzing: 'Analyzing…',
  ready: 'No suggestions yet',
  readyHint: 'Click "Generate suggestions" to get platform ideas.',
  postLabel: 'Suggested post',
  copy: 'Copy',
  copied: 'Copied'
} as const;

interface Props {
  projectId: string;
  labels?: Partial<Record<keyof typeof DEFAULT_LABELS, string>>;
}

interface SurveyPlatformSuggestion {
  platform: string;
  subplatform?: string;
  reason: string;
  postingStrategy: string;
  expectedReach: string;
  post: string;
}

interface ApiResponse {
  platforms: SurveyPlatformSuggestion[];
}

const props = defineProps<Props>();

const labels = computed(() => ({ ...DEFAULT_LABELS, ...(props.labels ?? {}) }));

const httpClient = container.get<HttpClientPort>(ROOT_TYPES.HttpClient);
const loading = ref(false);
const error = ref<string | null>(null);
const platforms = ref<SurveyPlatformSuggestion[]>([]);
const copiedPostIndex = ref<number | null>(null);
const loadedProjectId = ref<string | null>(null);

async function generatePlatforms(): Promise<void> {
  if (!props.projectId) return;
  if (loadedProjectId.value === props.projectId && platforms.value.length > 0) return;
  loading.value = true;
  error.value = null;
  try {
    const data = await httpClient.post<ApiResponse>(
      API_CONFIG.ENDPOINTS.SUGGEST_PLATFORMS(props.projectId),
      {}
    );
    platforms.value = data.platforms;
    loadedProjectId.value = props.projectId;
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to generate platform suggestions';
    console.error('Failed to generate platform suggestions:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (props.projectId) generatePlatforms();
});

watch(() => props.projectId, (newProjectId) => {
  if (newProjectId && loadedProjectId.value !== newProjectId) {
    platforms.value = [];
    error.value = null;
    generatePlatforms();
  }
});

function getPlatformUrl(platform: string, subplatform?: string): string {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('reddit')) return 'https://www.reddit.com/';
  if (platformLower.includes('hacker news')) return 'https://news.ycombinator.com/';
  if (platformLower.includes('indie hackers')) return 'https://www.indiehackers.com/';
  if (platformLower.includes('respondent')) return 'https://www.respondent.io/';
  if (platformLower.includes('prolific')) return 'https://www.prolific.com/';
  if (platformLower.includes('linkedin')) return 'https://www.linkedin.com/';
  if (platformLower.includes('discord')) return 'https://discord.com/';
  return `https://www.google.com/search?q=${encodeURIComponent(platform)}`;
}

function getSubplatformLinks(platform: string, subplatform: string): Array<{ text: string; url: string }> {
  const platformLower = platform.toLowerCase();
  const links: Array<{ text: string; url: string }> = [];
  if (platformLower.includes('reddit')) {
    const subreddits = subplatform.match(/r\/[\w-]+/g);
    if (subreddits && subreddits.length > 0) {
      [...new Set(subreddits)].forEach(subreddit => {
        links.push({ text: subreddit, url: `https://www.reddit.com/${subreddit}/` });
      });
    }
  } else if (platformLower.includes('linkedin')) {
    subplatform.split(',').map(s => s.trim()).forEach(part => {
      links.push({ text: part, url: `https://www.linkedin.com/search/results/groups/?keywords=${encodeURIComponent(part)}` });
    });
  } else if (platformLower.includes('discord')) {
    subplatform.split(',').map(s => s.trim()).forEach(part => {
      links.push({ text: part, url: `https://discord.com/search?q=${encodeURIComponent(part)}` });
    });
  } else {
    const parts = subplatform.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (parts.length > 1) {
      parts.forEach(part => {
        links.push({ text: part, url: `https://www.google.com/search?q=${encodeURIComponent(platform + ' ' + part)}` });
      });
    }
  }
  return links;
}

function copyPost(post: string, event: Event): void {
  event.stopPropagation();
  navigator.clipboard.writeText(post).then(() => {
    copiedPostIndex.value = platforms.value.findIndex(p => p.post === post);
    setTimeout(() => { copiedPostIndex.value = null; }, 2000);
  }).catch(err => console.error('Failed to copy post:', err));
}
</script>

<style scoped>
.survey-platforms-widget {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  overflow: hidden;
}
.spw-header { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-bottom: 1px solid var(--color-border); }
.spw-title { font-size: 1rem; font-weight: 600; color: var(--color-text); margin: 0; }
.spw-generate-btn {
  padding: 0.5rem 0.75rem; background: var(--color-accent); color: white; border: none; border-radius: var(--radius-sm);
  font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: background-color 0.2s ease;
}
.spw-generate-btn:hover:not(:disabled) { background: var(--color-accent-hover); }
.spw-generate-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.spw-loading { display: flex; align-items: center; gap: 0.5rem; padding: 1.5rem 1.25rem; color: var(--color-text-muted); font-size: 0.875rem; }
.spw-loading-dots { display: flex; gap: 3px; }
.spw-loading-dots span { width: 5px; height: 5px; border-radius: 50%; background: var(--color-accent); animation: spw-pulse 1.2s ease-in-out infinite; }
.spw-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.spw-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes spw-pulse { 0%, 80%, 100% { opacity: 0.3; } 40% { opacity: 1; } }
.spw-empty { padding: 2rem 1.25rem; text-align: center; color: var(--color-text-muted); font-size: 0.875rem; }
.spw-empty-icon { width: 2rem; height: 2rem; margin: 0 auto 0.75rem; color: var(--color-text-muted); opacity: 0.5; }
.spw-empty-hint { margin-top: 0.5rem; color: var(--color-text-muted); font-size: 0.8125rem; }
.spw-platforms { padding: 0; }
.spw-platform-card { border-bottom: 1px solid var(--color-border); padding: 1rem 1.25rem; }
.spw-platform-card:last-child { border-bottom: none; }
.spw-platform-header { margin-bottom: 0.75rem; }
.spw-platform-name-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.5rem; }
.spw-platform-name { font-weight: 600; color: var(--color-text); font-size: 1rem; }
.spw-platform-link { color: var(--color-accent); text-decoration: none; }
.spw-platform-link:hover { text-decoration: underline; }
.spw-platform-sub { display: inline-block; background: var(--color-bg-subtle); color: var(--color-text-muted); padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.75rem; margin-right: 0.375rem; }
.spw-platform-meta { display: flex; align-items: center; gap: 0.75rem; margin-top: 0.5rem; font-size: 0.875rem; color: var(--color-text-muted); }
.spw-platform-reason { color: var(--color-text); font-size: 0.875rem; line-height: 1.6; margin: 0.75rem 0; }
.spw-platform-reason p { margin: 0; }
.spw-platform-post { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--color-border); }
.spw-post-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.75rem; gap: 0.75rem; }
.spw-post-label { font-size: 0.875rem; font-weight: 600; color: var(--color-text); }
.spw-copy-btn { padding: 0.375rem 0.75rem; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-size: 0.875rem; font-weight: 500; color: var(--color-text); cursor: pointer; }
.spw-copy-btn:hover { background: var(--color-bg-subtle); }
.spw-copy-btn.copied { background: var(--color-success-bg); border-color: var(--color-success); color: var(--color-success); }
.spw-post-content { background: var(--color-bg-subtle); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; color: var(--color-text); font-size: 0.875rem; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; }
@media (max-width: 768px) {
  .spw-header { flex-direction: column; gap: 0.75rem; align-items: flex-start; }
  .spw-generate-btn { width: 100%; }
  .spw-platform-card { padding: 1rem; }
  .spw-post-header { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
}
</style>
